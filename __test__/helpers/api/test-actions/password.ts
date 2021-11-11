import User from "@models/user/user";
import { userAttributes } from "@test/sample_data/model/attributes";
import BaseWorld from "@test/support/base_world";
import { apiRequest } from "./";

export async function forgotPassword(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "forgotPassword", {
        cookie: {
            saveCookie: false,
            withCookie: false,
        },
    });
}

export async function resetPassword(this: BaseWorld): Promise<void> {
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
