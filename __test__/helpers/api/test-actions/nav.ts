import BaseWorld from "@test/support/base_world";
import { apiRequest } from "../test-actions";

export async function getNav(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "getNav", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        errorOnFail: true,
        method: "get",
    });
}
