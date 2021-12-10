import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export const forgotPassword = async function forgotPassword(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    email: string
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            saveCookie: false,
            withCookie: false,
        },
        body: { email },
    });
} as ApiTestFn;

export const resetPassword = async function resetPassword(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    token: string,
    body: { confirm_password: string; password: string }
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: { saveCookie: true, withCookie: false },
        param: token,
        body,
    });
} as ApiTestFn;
