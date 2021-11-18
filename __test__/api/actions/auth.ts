import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export async function login(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest.call(baseWorld, "login", {
        cookie: {
            saveCookie: true,
            withCookie: false,
        },
    });
}

export async function logout(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest.call(baseWorld, "logout", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
    });
}

export async function authCheck(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest.call(baseWorld, "authCheck", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
    });
}
