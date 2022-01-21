import { Request, Response } from "express";
import * as memberInviteService from "@services/data/member_invitation";
import * as userService from "@services/data/user";
import User from "@models/user/user";
import Business from "@models/business";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import { sendUserInviteEmail } from "@services/email";
import { getConnection } from "typeorm";

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

export const create = async (req: Request, res: Response): Promise<void> => {
    const {
        body,
        session: { current_business_id, user_id },
    } = req;

    const connection = getConnection();

    const userId = await userService.create(body);
    const token = await memberInviteService.create({
        user_id: userId,
        business_id: current_business_id ?? NaN,
        updated_by_user_id: user_id ?? NaN,
    });

    // Get info to send notification email to 'new' User
    const [sender, business] = await Promise.all([
        connection.manager.findOne(User, {
            where: { id: user_id },
        }),
        connection.manager.findOne(Business, {
            where: { id: current_business_id },
        }),
    ]);

    if (!sender || !business) {
        // Unrelistic that this will be hit but needs to be here for type validation
        throw new DataServiceError(
            "Unable to retrive information to notify user by email",
            ServiceErrorReasons.DATABASE_ERROR
        );
    }

    await sendUserInviteEmail(connection, business, token, sender, user);
};

export const accept = async (req: Request, res: Response): Promise<void> => {};

/**
 * Sends MembershipInvitation details to the given user
 * Checks if there is a membership first (fails if true)
 * Then checks if there is a MembershipInvitation (generates new token if true, creates new MembershipInvitation if false)
 * Then sends email to the given user
 * confirmation if updated_by_user has rights is done as part of the application level middleware
 * @param {InviteMemberProps} userInfo Basis for a new User
 * @param {number} business_id
 * @param {number} updated_by_user_id
 */
export const create = async (
    business_id: number
): Promise<{ token: string; user: User }> => {
    return await new Promise<{
        token: string;
        user: User;
    }>((res, rej) => {
        connection
            .transaction(async (entityManager) => {
                let user: User;

                if (
                    !(await userService.exists(userInfo.email, entityManager))
                ) {
                    // This is allowed to throw an error because the error type is expected at the route level
                    const id = await userService.create(
                        { ...userInfo, password: "" },
                        entityManager
                    );
                    // We expect this to pass if the above doesn't throw an error
                    user = await entityManager.findOneOrFail(User, {
                        where: { id },
                    });
                } else {
                    // This should pass because exists passes
                    user = await entityManager.findOneOrFail(User, {
                        where: { email: userInfo.email },
                    });
                }

                if (
                    await businessService.hasUser(
                        user.id,
                        business_id,
                        entityManager
                    )
                ) {
                    throw new ServiceError(
                        "User is a member of the business already",
                        ServiceErrorReasons.PARAMETERS_MISSING
                    );
                }

                // Update token if an association request exists
                // Otherwise create a new request
                let token = "";

                const where = {
                    business_id,
                    user_id: user.id,
                };

                if (await memberInviteService.hasUser(where, entityManager)) {
                    token = await memberInviteService.refresh(
                        where,
                        entityManager
                    );
                } else {
                    token = await memberInviteService.create(
                        {
                            ...where,
                            updated_by_user_id: user.id,
                        },
                        entityManager
                    );
                }

                res({ token, user });
            })
            .catch((reason) => {
                rej(reason);
            });
    });
};

/**
 * Confirms the association between user and business
 * Allows user to set password afterwards
 * @param token
 */
export const accept = async (token: string): Promise<void> => {
    const connection = getConnection();

    const membershipRequest = await connection.manager.findOne(
        MembershipInvitation,
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
    const memberships = await membershipService.get(membershipRequest.user_id);

    await businessService.addUser(
        membershipRequest.user_id,
        membershipRequest.business_id,
        membershipRequest.user_id,
        memberships.length === 0
    );

    const [user] = await Promise.all([
        // Check if user needs to finish registration
        connection.manager.findOne(User, {
            where: { id: membershipRequest.user_id },
        }),
        // Delete request
        connection.manager.delete(MembershipInvitation, membershipRequest),
    ]);

    if (!user) {
        throw new ServiceError(
            "Couldn't retrieve user",
            ServiceErrorReasons.DATABASE_ERROR
        );
    }

    if (!user.password) {
        // Allow user to finish registration
        await enableReset(user);
    }
};
