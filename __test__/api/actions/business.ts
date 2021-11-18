import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export async function getBusinesses(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest.call(baseWorld, "getBusinesses", {
        cookie: { withCookie: true, saveCookie: true },
        errorOnFail: true,
        method: "get",
    });
}

export async function registerBusiness(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest.call(baseWorld, "registerBusiness", {
        cookie: {
            saveCookie: true,
            withCookie: false,
        },
    });
}
