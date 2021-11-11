import BaseWorld from "@test/support/base_world";
import { apiRequest } from "./";

export async function getBusinesses(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "getBusinesses", {
        cookie: { withCookie: true, saveCookie: true },
        errorOnFail: true,
        method: "get",
    });
}

export async function registerBusiness(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "registerBusiness", {
        cookie: {
            saveCookie: true,
            withCookie: false,
        },
    });
}
