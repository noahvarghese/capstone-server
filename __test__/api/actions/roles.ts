import Business from "@models/business";
import Department from "@models/department";
import { PermissionAttributes } from "@models/permission";
import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

export async function createRole(
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

    await apiRequest.call(baseWorld, "createRole", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        body: {
            name: "TEST",
            department: department.id,
        },
    });
}

export async function deleteRole(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    ids: number[]
): Promise<void> {
    await apiRequest.call(baseWorld, "deleteRole", {
        cookie: { saveCookie: true, withCookie: true },
        query: { ids },
        method: "delete",
    });
}

export async function editRole(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    name: string,
    permissions: PermissionAttributes,
    id: number,
    errorOnFail = false
): Promise<void> {
    await apiRequest.call(baseWorld, "editRole", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        errorOnFail,
        query: { id },
        body: { name, permissions },
        method: "put",
    });
}

export async function readOneRole(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    id: number
): Promise<void> {
    await apiRequest.call(baseWorld, "readOneRole", {
        cookie: { saveCookie: true, withCookie: true },
        param: id.toString(),
        method: "get",
    });
}

/**
 * This will need parameters to sort and filter in the query
 * @param baseWorld
 */
export async function readManyRoles(
    this: ApiTestFn,
    baseWorld: BaseWorld
): Promise<void> {
    await apiRequest.call(baseWorld, "readManyRoles", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        method: "get",
    });
}
