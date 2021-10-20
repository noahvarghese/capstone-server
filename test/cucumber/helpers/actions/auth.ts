import Membership from "@models/membership";
import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";
import { InviteUserProps } from "@routes/member/invite";
import attributes from "@test/sample_data/api/attributes";
import BaseWorld from "@test/cucumber/support/base_world";
import loadAndCall, { ActionFnMap } from ".";
import { userAttributes } from "@test/sample_data/model/attributes";

/**
 * Finds the token for the membership request
 * Then makes a rerquest to the url with the token
 * @param this
 */
async function acceptInvite(this: BaseWorld): Promise<void> {
    const connection = this.getConnection();

    // retrieve token
    const { email } = attributes.inviteUser() as InviteUserProps;

    const invitedUser = await connection.manager.findOneOrFail(User, {
        where: { email },
    });

    const membershipRequest = await connection.manager.findOneOrFail(
        MembershipRequest,
        {
            where: { user_id: invitedUser.id },
        }
    );

    await loadAndCall.call(
        this,
        "acceptInvite",
        {
            withCookie: false,
            saveCookie: true,
        },
        membershipRequest.token
    );
}

/**
 * Sending an invite can be done for a 'new' user or existing
 * if user exists in database before api call, only an invite gets created
 * @param this
 * @param {"new" | "existing"} userType dictates whether to create a user via api
 */
async function inviteUser(
    this: BaseWorld,
    userType: "new" | "existing"
): Promise<void> {
    // create user before api call if required
    if (userType === "existing") {
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
                email: process.env.SECONDARY_TEST_EMAIL,
                first_name: "TEST",
                last_name: "TEST",
                password: userAttributes().password,
            })
        );
    }

    await loadAndCall.call(this, "inviteUser", {
        withCookie: true,
        saveCookie: true,
        errOnFail: true,
    });
}

async function login(this: BaseWorld): Promise<void> {
    await loadAndCall.call(this, "login", {
        saveCookie: true,
        withCookie: false,
    });
}

async function logout(this: BaseWorld): Promise<void> {
    await loadAndCall.call(this, "logout", {
        saveCookie: true,
        withCookie: true,
    });
}

async function authCheck(this: BaseWorld): Promise<void> {
    await loadAndCall.call(this, "authCheck", {
        saveCookie: true,
        withCookie: true,
    });
}

async function forgotPassword(this: BaseWorld): Promise<void> {
    await loadAndCall.call(this, "forgotPassword", {
        saveCookie: false,
        withCookie: false,
    });
}

async function resetPassword(this: BaseWorld): Promise<void> {
    const connection = this.getConnection();

    // get token
    const user = await connection.manager.findOneOrFail(User, {
        where: { email: userAttributes().email },
    });

    await loadAndCall.call(
        this,
        "resetPassword",
        { saveCookie: true, withCookie: false },
        user.token ?? ""
    );
}

async function registerBusiness(this: BaseWorld): Promise<void> {
    await loadAndCall.call(this, "registerBusiness", {
        saveCookie: true,
        withCookie: false,
    });
}

const authActions: ActionFnMap = {
    registerBusiness,
    login,
    logout,
    forgotPassword,
    resetPassword,
    inviteUser,
    acceptInvite,
    authCheck,
};

export default authActions;
