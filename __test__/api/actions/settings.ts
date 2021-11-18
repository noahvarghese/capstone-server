import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export async function getNav(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest.call(baseWorld, this.name, {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        errorOnFail: true,
        method: "get",
    });
}
