import BaseWorld from "@test/support/base_world";
import apiAttributes from "@test/sample_data/api/attributes";
import { userAttributes } from "@test/sample_data/model/attributes";
import { ApiRoute, urls } from "@test/sample_data/api/dependencies";
import Form from "./form";
import { InviteUserProps } from "@routes/members/invite";
import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";

export type ActionFnMap = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [i in ApiRoute]: (this: BaseWorld, ...args: any[]) => Promise<void>;
};

export async function apiRequest(
    this: BaseWorld,
    key: ApiRoute,
    opts?: {
        cookie?: {
            withCookie: boolean;
            saveCookie: boolean;
        };
        token?: string | null;
        body?: Record<string, unknown>;
        query?: Record<string, unknown>;
        errorOnFail?: boolean;
        method?: "get" | "post" | "put" | "delete";
    }
): Promise<void> {
    if (!opts?.body) Form.load.call(this, key);
    else this.setCustomProp<typeof opts.body>("body", opts.body);

    await Form.submit.call(
        this,
        typeof urls[key] === "function"
            ? (urls[key] as (token: string) => string)(opts?.token ?? "")
            : (urls[key] as string),
        Boolean(opts?.cookie?.saveCookie),
        Boolean(opts?.cookie?.withCookie),
        opts?.errorOnFail,
        opts?.method,
        opts?.query
    );
}

/**
 * Finds the token for the membership request
 * Then makes a rerquest to the url with the token
 * @param this
 */
async function acceptInvite(this: BaseWorld): Promise<void> {
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

    await apiRequest.call(this, "inviteUser", {
        cookie: {
            withCookie: true,
            saveCookie: true,
        },
    });
}

async function login(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "login", {
        cookie: {
            saveCookie: true,
            withCookie: false,
        },
    });
}

async function logout(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "logout", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
    });
}

async function authCheck(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "authCheck", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
    });
}

async function forgotPassword(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "forgotPassword", {
        cookie: {
            saveCookie: false,
            withCookie: false,
        },
    });
}

async function resetPassword(this: BaseWorld): Promise<void> {
    const connection = this.getConnection();

    // get token
    const { token } = await connection.manager.findOneOrFail(User, {
        where: { email: userAttributes().email },
    });

    await apiRequest.call(this, "resetPassword", {
        cookie: { saveCookie: true, withCookie: false },
        token,
    });
}

async function registerBusiness(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "registerBusiness", {
        cookie: {
            saveCookie: true,
            withCookie: false,
        },
    });
}

async function createRole(this: BaseWorld): Promise<void> {
    const business = await this.getConnection().manager.findOneOrFail(
        Business,
        { where: { name: this.getCustomProp<string[]>("businessNames")[0] } }
    );

    const department = await this.getConnection().manager.findOneOrFail(
        Department,
        { where: { business_id: business.id, name: "Admin" } }
    );

    await apiRequest.call(this, "createRole", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        body: {
            name: "TEST",
            department: department.id,
        },
    });
}

async function deleteRole(this: BaseWorld, ids: number[]): Promise<void> {
    await apiRequest.call(this, "deleteRole", {
        cookie: { saveCookie: true, withCookie: true },
        query: { ids },
        method: "delete",
    });
}

async function createDepartment(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "createDepartment", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
    });
}

async function deleteDepartment(this: BaseWorld, ids: number[]): Promise<void> {
    await apiRequest.call(this, "deleteDepartment", {
        cookie: { saveCookie: true, withCookie: true },
        query: { ids },
        method: "delete",
    });
}

async function editDepartment(
    this: BaseWorld,
    name: string,
    id: number
): Promise<void> {
    await apiRequest.call(this, "editDepartment", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        query: { id },
        body: { name },
        method: "put",
    });
}

const actions: ActionFnMap = {
    registerBusiness,
    login,
    logout,
    forgotPassword,
    resetPassword,
    inviteUser,
    acceptInvite,
    authCheck,
    createDepartment,
    deleteDepartment,
    editDepartment,
    createRole,
    deleteRole,
};

export default actions;
