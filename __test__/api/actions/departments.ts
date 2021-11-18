import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export async function createDepartment(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest.call(baseWorld, "createDepartment", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
    });
}

export async function deleteDepartment(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    ids: number[]
): Promise<void> {
    await apiRequest.call(baseWorld, "deleteDepartment", {
        cookie: { saveCookie: true, withCookie: true },
        query: { ids },
        method: "delete",
    });
}

export async function editDepartment(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    name: string,
    id: number
): Promise<void> {
    await apiRequest.call(baseWorld, "editDepartment", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        query: { id },
        body: { name },
        method: "put",
    });
}
