import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";
import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";
import { inviteMember as inviteMemberAttributes } from "@test/api/attributes/member";
import { userAttributes } from "@test/model/attributes";
import Membership from "@models/membership";

/**
 * Finds the token for the membership request
 * Then makes a rerquest to the url with the token
 * @param baseWorld
 */
export const acceptInvite = async function acceptInvite(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    const connection = baseWorld.getConnection();

    // retrieve token
    const { email } = inviteMemberAttributes();

    const invitedUser = await connection.manager.findOneOrFail(User, {
        where: { email },
    });

    const { token } = await connection.manager.findOneOrFail(
        MembershipRequest,
        {
            where: { user_id: invitedUser.id },
        }
    );

    await apiRequest(baseWorld, this.name, {
        cookie: {
            withCookie: false,
            saveCookie: true,
        },
        token,
    });
} as ApiTestFn;

export const readOneMember = async function readOneMember(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    userId: number
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: { withCookie: true, saveCookie: false },
        param: userId.toString(),
        errorOnFail: true,
        method: "get",
    });
} as ApiTestFn;

export const readManyMembers = async function readManyMembers(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: { withCookie: true, saveCookie: false },
        errorOnFail: true,
        method: "get",
    });
} as ApiTestFn;

/**
 * Sending an invite can be done for a 'new' user or existing
 * if user exists in database before api call, only an invite gets created
 * @param baseWorld
 * @param {"new" | "existing"} userType dictates whether to create a user via api
 */
export const inviteMember = async function inviteMember(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    userType: "create" | "default"
): Promise<void> {
    // create user before api call if required
    if (userType === "create") {
        const connection = baseWorld.getConnection();
        const adminUser = await connection.manager.findOneOrFail(User, {
            where: { email: userAttributes().email },
        });

        await connection.manager.findOneOrFail(Membership, {
            where: { user_id: adminUser.id },
        });

        await connection.manager.insert(
            User,
            new User({
                ...inviteMemberAttributes(),
                password: userAttributes().password,
            })
        );
    }

    await apiRequest(baseWorld, this.name, {
        cookie: {
            withCookie: true,
            saveCookie: false,
        },
    });
} as ApiTestFn;
