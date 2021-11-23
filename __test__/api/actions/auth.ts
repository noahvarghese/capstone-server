import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export const login = async function login(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            saveCookie: true,
            withCookie: false,
        },
    });
} as ApiTestFn;

export const logout = async function logout(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
    });
} as ApiTestFn;

export const authCheck = async function authCheck(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
    });
} as ApiTestFn;
