import BaseWorld from "@test/support/base_world";
import { apiRequest } from "@test/api/actions";

export async function login(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "login", {
        cookie: {
            saveCookie: true,
            withCookie: false,
        },
    });
}

export async function logout(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "logout", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
    });
}

export async function authCheck(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "authCheck", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
    });
}
