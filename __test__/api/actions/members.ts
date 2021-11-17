import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";
import { InviteUserProps } from "@routes/members/invite";
import BaseWorld from "@test/support/base_world";
import { apiRequest } from "@test/api/actions";
import apiAttributes from "@test/api/attributes";
import { userAttributes } from "@test/model/attributes";
import Membership from "@models/membership";
import attributes from "@test/api/attributes";

/**
 * Finds the token for the membership request
 * Then makes a rerquest to the url with the token
 * @param this
 */
export async function acceptInvite(this: BaseWorld): Promise<void> {
    const connection = this.getConnection();

    // retrieve token
    const { email } = apiAttributes.inviteUser() as InviteUserProps;

    const invitedUser = await connection.manager.findOneOrFail(User, {
        where: { email },
    });

    const { token } = await connection.manager.findOneOrFail(
        MembershipRequest,
        {
            where: { user_id: invitedUser.id },
        }
    );

    await apiRequest.call(this, "acceptInvite", {
        cookie: {
            withCookie: false,
            saveCookie: true,
        },
        token,
    });
}

/**
 * Sending an invite can be done for a 'new' user or existing
 * if user exists in database before api call, only an invite gets created
 * @param this
 * @param {"new" | "existing"} userType dictates whether to create a user via api
 */
export async function inviteUser(
    this: BaseWorld,
    userType: "create" | "default"
): Promise<void> {
    // create user before api call if required
    if (userType === "create") {
        const connection = this.getConnection();
        const adminUser = await connection.manager.findOneOrFail(User, {
            where: { email: userAttributes().email },
        });

        await connection.manager.findOneOrFail(Membership, {
            where: { user_id: adminUser.id },
        });

        await connection.manager.insert(
            User,
            new User({
                ...attributes.inviteUser(),
                password: userAttributes().password,
            })
        );
    }

    await apiRequest.call(this, "inviteUser", {
        cookie: {
            withCookie: true,
            saveCookie: false,
        },
    });
}
