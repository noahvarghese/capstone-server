import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export const getBusinesses = async function getBusinesses(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: { withCookie: true, saveCookie: true },
        errorOnFail: true,
        method: "get",
    });
} as ApiTestFn;

export const registerBusiness = async function registerBusiness(
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
