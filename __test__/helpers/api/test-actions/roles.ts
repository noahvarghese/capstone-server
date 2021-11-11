import Business from "@models/business";
import Department from "@models/department";
import { PermissionAttributes } from "@models/permission";
import BaseWorld from "@test/support/base_world";
import { apiRequest } from "./";

export async function createRole(this: BaseWorld): Promise<void> {
    const business = await this.getConnection().manager.findOneOrFail(
        Business,
        { where: { name: this.getCustomProp<string[]>("businessNames")[0] } }
    );

    const department = await this.getConnection().manager.findOneOrFail(
        Department,
        { where: { business_id: business.id, name: "Admin" } }
    );

    await apiRequest.call(this, "createRole", {
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
    this: BaseWorld,
    ids: number[]
): Promise<void> {
    await apiRequest.call(this, "deleteRole", {
        cookie: { saveCookie: true, withCookie: true },
        query: { ids },
        method: "delete",
    });
}

export async function editRole(
    this: BaseWorld,
    name: string,
    permissions: PermissionAttributes,
    id: number,
    errorOnFail = false
): Promise<void> {
    await apiRequest.call(this, "editRole", {
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

export async function readOneRole(this: BaseWorld, id: number): Promise<void> {
    await apiRequest.call(this, "readOneRole", {
        cookie: { saveCookie: true, withCookie: true },
        param: id.toString(),
        method: "get",
    });
}

/**
 * This will need parameters to sort and filter in the query
 * @param this
 */
export async function readManyRoles(this: BaseWorld): Promise<void> {
    await apiRequest.call(this, "readManyRoles", {
        cookie: {
            saveCookie: true,
            withCookie: true,
        },
        method: "get",
    });
}
