import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export const getNav = async function getNav(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        errorOnFail: true,
        method: "get",
    });
} as ApiTestFn;
