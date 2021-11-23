import User from "@models/user/user";
import { userAttributes } from "@test/model/attributes";
import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export const forgotPassword = async function forgotPassword(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            saveCookie: false,
            withCookie: false,
        },
    });
} as ApiTestFn;

export const resetPassword = async function resetPassword(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    const connection = baseWorld.getConnection();

    // get token
    const { token } = await connection.manager.findOneOrFail(User, {
        where: { email: userAttributes().email },
    });

    await apiRequest(baseWorld, this.name, {
        cookie: { saveCookie: true, withCookie: false },
        token,
    });
} as ApiTestFn;
