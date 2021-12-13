import Business from "@models/business";
import Membership from "@models/membership";
import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";
import { sendUserInviteEmail } from "@services/email";
import ServiceError, { ServiceErrorReasons } from "@util/errors/service";
import { getConnection, MoreThan } from "typeorm";
import * as membershipService from "@services/data/memberships";
import { enablePasswordReset } from "../password";

export interface InviteMemberProps {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
}

export const emptyInviteUser = (): InviteMemberProps => ({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
});

/**
 * Sends MembershipRequest details to the given user
 * Checks if there is a membership first (fails if true)
 * Then checks if there is a MembershipRequest (generates new token if true, creates new MembershipRequest if false)
 * Then sends email to the given user
 * confirmation if updated_by_user has rights is done as part of the application level middleware
 * @param {InviteMemberProps} userInfo Basis for a new User
 * @param {number} business_id
 * @param {number} updated_by_user_id
 */
export const sendInvite = async (
    userInfo: InviteMemberProps,
    business_id: number,
    updated_by_user_id: number
): Promise<void> => {
    const connection = getConnection();

    // this should do an upsert as the email is marked as UNIQUE in the database
    let user = await connection.manager.findOne(User, {
        where: { email: userInfo.email },
    });

    if (!user) {
        const result = await connection.manager.insert(
            User,
            new User(userInfo)
        );
        user = await connection.manager.findOneOrFail(User, {
            where: { id: result.identifiers[0].id },
        });
    }

    // Checks whether user and business are associated already
    const existingMembership = await connection.manager.findOne(Membership, {
        where: {
            user_id: user.id,
            business_id,
        },
    });

    if (existingMembership)
        throw new ServiceError(
            "User is a member of the business already",
            ServiceErrorReasons.PARAMETERS_MISSING
        );

    // Update token if an association request exists
    // Otherwise create a new request
    let membershipRequest = await connection.manager.findOne(
        MembershipRequest,
        { where: { business_id, user_id: user.id } }
    );

    if (membershipRequest) {
        membershipRequest.generateToken();

        await connection.manager.update(
            MembershipRequest,
            {
                user_id: user.id,
                business_id,
            },
            membershipRequest
        );
    } else {
        membershipRequest = new MembershipRequest({
            user_id: user.id,
            business_id,
            updated_by_user_id,
        });

        await connection.manager.insert(MembershipRequest, membershipRequest);
    }

    // Get info to send notification email to 'new' User

    const [sender, business] = await Promise.all([
        connection.manager.findOne(User, {
            where: { id: updated_by_user_id },
        }),
        connection.manager.findOne(Business, {
            where: { id: business_id },
        }),
    ]);

    if (!sender || !business) {
        // Unrelistic that this will be hit but needs to be here for type validation
        throw new ServiceError(
            "Unable to retrive information to notify user by email",
            ServiceErrorReasons.DATABASE_ERROR
        );
    }

    await sendUserInviteEmail(
        connection,
        business,
        membershipRequest.token,
        sender,
        user
    );
};

/**
 * Confirms the association between user and business
 * Allows user to set password afterwards
 * @param token
 */
export const acceptInvite = async (token: string): Promise<void> => {
    const connection = getConnection();

    const membershipRequest = await connection.manager.findOne(
        MembershipRequest,
        { where: { token, token_expiry: MoreThan(new Date()) } }
    );

    if (!membershipRequest) {
        throw new ServiceError(
            "No invitation found, please ask your manager for a new invitation",
            ServiceErrorReasons.PARAMETERS_MISSING
        );
    }

    // check if there is an existing membership
    // only the first membership gets set to default automatically
    const memberships = await membershipService.getAll(
        membershipRequest.user_id
    );

    const setDefault = memberships.length === 0;

    await connection.manager.insert(
        Membership,
        new Membership({
            business_id: membershipRequest.business_id,
            updated_by_user_id: membershipRequest.user_id,
            user_id: membershipRequest.user_id,
            default: setDefault,
        })
    );

    const [user] = await Promise.all([
        // Check if user needs to finish registration
        await connection.manager.findOne(User, {
            where: { id: membershipRequest.user_id },
        }),
        // Delete request
        connection.manager.delete(MembershipRequest, membershipRequest),
    ]);

    if (!user) {
        throw new ServiceError(
            "Couldn't retrieve user",
            ServiceErrorReasons.DATABASE_ERROR
        );
    }

    if (!user.password) {
        // Allow user to finish registration
        await enablePasswordReset(user);
    }
};
