import BaseWorld from "@test/support/base_world";
import { apiRequest } from "@test/api/actions";

export async function createDepartment(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "createDepartment", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
    });
}

export async function deleteDepartment(
    this: BaseWorld,
    ids: number[]
): Promise<void> {
    await apiRequest.call(this, "deleteDepartment", {
        cookie: { saveCookie: true, withCookie: true },
        query: { ids },
        method: "delete",
    });
}

export async function editDepartment(
    this: BaseWorld,
    name: string,
    id: number
): Promise<void> {
    await apiRequest.call(this, "editDepartment", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        query: { id },
        body: { name },
        method: "put",
    });
}
