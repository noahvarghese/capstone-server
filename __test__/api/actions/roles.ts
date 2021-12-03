import Business from "@models/business";
import Department from "@models/department";
import { PermissionAttributes } from "@models/permission";
import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export const createRole = async function createRole(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    const business = await baseWorld
        .getConnection()
        .manager.findOneOrFail(Business, {
            where: {
                name: baseWorld.getCustomProp<string[]>("businessNames")[0],
            },
        });

    const department = await baseWorld
        .getConnection()
        .manager.findOneOrFail(Department, {
            where: { business_id: business.id, name: "Admin" },
        });

    await apiRequest(baseWorld, this.name, {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        body: {
            name: "TEST",
            department: department.id,
        },
    });
} as ApiTestFn;

export const deleteRole = async function deleteRole(
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

export const editRole = async function editRole(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    {
        id,
        ...details
    }: {
        id: number;
        name?: string;
        permissions?: PermissionAttributes;
        department_id?: number;
    },
    errorOnFail = false
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        errorOnFail: errorOnFail as boolean,
        param: id.toString(),
        body: { ...details },
        method: "put",
    });
} as ApiTestFn;

export const readOneRole = async function readOneRole(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    id: number
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: { saveCookie: true, withCookie: true },
        param: id.toString(),
        method: "get",
    });
} as ApiTestFn;

/**
 * This will need parameters to sort and filter in the query
 * @param baseWorld
 */
export const readManyRoles = async function readManyRoles(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        method: "get",
    });
} as ApiTestFn;
