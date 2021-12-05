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
            saveCookie: false,
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
        cookie: { saveCookie: false, withCookie: true },
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
            saveCookie: false,
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
        cookie: { saveCookie: false, withCookie: true },
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
    baseWorld: BaseWorld,
    opts?: {
        query: {
            page?: number;
            limit?: number;
            sortField?: string;
            sortOrder?: "ASC" | "DESC" | "" | undefined;
            filterField?: string;
            filterIds?: number[];
            search?: string;
        };
    }
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            saveCookie: false,
            withCookie: true,
        },
        method: "get",
        query: opts?.query ?? {},
    });
} as ApiTestFn;

export const memberAssignment = async function memberAssignment(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    body: { user_ids: number[]; role_id: number }
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            withCookie: true,
            saveCookie: false,
        },
        method: "post",
        body,
        errorOnFail: false,
    });
} as ApiTestFn;

export const memberRemoval = async function memberRemoval(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    query: { user_ids: number[]; role_id: number }
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            withCookie: true,
            saveCookie: false,
        },
        method: "delete",
        query,
        errorOnFail: false,
    });
} as ApiTestFn;
