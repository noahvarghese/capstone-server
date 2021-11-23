import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export const createDepartment = async function createDepartment(
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

export const deleteDepartment = async function deleteDepartment(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    ids: number[]
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: { saveCookie: true, withCookie: true },
        query: { ids },
        method: "delete",
    });
} as ApiTestFn;

export const editDepartment = async function editDepartment(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    name: string,
    id: number
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        query: { id },
        body: { name },
        method: "put",
    });
} as ApiTestFn;
