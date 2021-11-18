import User from "@models/user/user";
import { userAttributes } from "@test/model/attributes";
import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export async function forgotPassword(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest.call(baseWorld, "forgotPassword", {
        cookie: {
            saveCookie: false,
            withCookie: false,
        },
    });
}

export async function resetPassword(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    const connection = baseWorld.getConnection();

    // get token
    const { token } = await connection.manager.findOneOrFail(User, {
        where: { email: userAttributes().email },
    });

    await apiRequest.call(baseWorld, "resetPassword", {
        cookie: { saveCookie: true, withCookie: false },
        token,
    });
}
