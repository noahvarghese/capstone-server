import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import Request from "@test/api/helpers/request";
import Role from "@models/role";
import {
    createDepartment,
    createRole,
    getBusiness,
    getDepartmentInBusiness,
    getRoleInDepartment,
} from "@test/api/helpers/setup-actions";
import Permission from "@models/permission";
import { RoleResponse } from "./roles";
import Department from "@models/department";
import { login } from "@test/api/actions/auth";
import {
    createRole as createRoleAction,
    deleteRole,
    editRole,
    readManyRoles,
    readOneRole,
} from "@test/api/actions/roles";
import { deepClone } from "@util/obj";
import { Connection } from "typeorm";

let baseWorld: BaseWorld;
const roleName = "TEST";
const adminDepartmentName = "Admin";
let connection: Connection;

beforeAll(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    connection = baseWorld.getConnection();
    await Helpers.Api.setup(baseWorld, "@setup_invite_member");
    // Given I am logged in as an admin
    await login.call(login, baseWorld);
});

describe("Basic role actions", () => {
    afterAll(async () => {
        await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
    });

    describe("Create role", () => {
        afterEach(async () => {
            await connection.manager.delete(Role, { name: roleName });
        });
        test("Global admin can create role", async () => {
            // When I create a role
            await createRoleAction.call(createRoleAction, baseWorld);
            // Then a new role exists
            Request.succeeded.call(baseWorld, { auth: false });
        });
    });

    describe("Delete role", () => {
        let id: number;
        beforeEach(async () => {
            id = await createRole.call(baseWorld, roleName, "Admin");
        });

        it("should succeed", async () => {
            //     When I delete a role
            await deleteRole.call(deleteRole, baseWorld, [id]);

            //     Then a role is deleted
            Request.succeeded.call(baseWorld, { auth: false });
            const count = await connection.manager.count(Role, {
                where: { id },
            });
            expect(count).toBe(0);
        });
    });

    test("Deleting a role that has users still associated fails", async () => {
        // Get admin default role
        const role_id = await getRoleInDepartment.call(
            baseWorld,
            "General",
            await getDepartmentInBusiness.call(
                baseWorld,
                "Admin",
                await getBusiness.call(baseWorld)
            )
        );

        // When a user tries to delete that role
        await deleteRole.call(deleteRole, baseWorld, [role_id]);

        // It is not deleted
        Request.failed.call(baseWorld, {
            include404: false,
            status: /^400$/,
            message:
                /^there are users associated with this role, please reassign them$/i,
        });
    });

    test("Invalid sort field", async () => {
        await readManyRoles.call(readManyRoles, baseWorld, {
            query: { sortField: "TEST123" },
        });

        Request.failed.call(baseWorld, {
            status: /^400$/,
            message: /^invalid field to sort by \w*$/i,
            include404: false,
        });
    });

    describe("requires a role", () => {
        let roleId: number;

        beforeAll(async () => {
            roleId = await createRole.call(
                baseWorld,
                roleName,
                adminDepartmentName
            );
        });
        afterAll(async () => {
            await connection.manager.delete(Role, roleId);
        });

        test("Pagination", async () => {
            // request first page
            await readManyRoles.call(readManyRoles, baseWorld, {
                query: { page: 1, limit: 1 },
            });

            const res1 =
                baseWorld.getCustomProp<RoleResponse[]>("responseData");

            // request second page
            await readManyRoles.call(readManyRoles, baseWorld, {
                query: { page: 2, limit: 1 },
            });

            // make sure a different user was returned
            const res2 =
                baseWorld.getCustomProp<RoleResponse[]>("responseData");
            expect(JSON.stringify(res1)).not.toBe(JSON.stringify(res2));
        });

        describe("Sorting", () => {
            const cases = [
                ["department", "ASC"],
                ["department", "DESC"],
                ["role", "ASC"],
                ["role", "DESC"],
            ];

            test.each(cases)(
                "given sort field %p and sort order %p, the results will match",
                async (sortField, sortOrder) => {
                    await readManyRoles.call(readManyRoles, baseWorld, {
                        query: { sortField, sortOrder },
                    });

                    const res =
                        baseWorld.getCustomProp<RoleResponse[]>("responseData");

                    const resCopy = deepClone(res);

                    const sortedRes = resCopy.sort((a, b): number => {
                        const aVal = JSON.stringify(
                            sortField === "department"
                                ? a.department.name
                                : a.name
                        );

                        const bVal = JSON.stringify(
                            sortField === "department"
                                ? b.department.name
                                : b.name
                        );

                        if (sortOrder === "ASC") {
                            return aVal < bVal ? -1 : aVal === bVal ? 0 : 1;
                        } else if (sortOrder === "DESC") {
                            return aVal < bVal ? 1 : aVal === bVal ? 0 : -1;
                        } else throw new Error("Invalid sort order");
                    });

                    expect(JSON.stringify(res)).toBe(JSON.stringify(sortedRes));
                }
            );
        });

        describe("Searching", () => {
            const cases = [
                // Searches based on department
                ["department", "adm"],
                // Search based on role
                ["name", "TE"],
            ];

            test.each(cases)(
                "Search field %p, search item %p",
                async (searchField, searchItem) => {
                    await readManyRoles.call(readManyRoles, baseWorld, {
                        query: { search: searchItem },
                    });

                    const res =
                        baseWorld.getCustomProp<RoleResponse[]>("responseData");

                    for (const role of res) {
                        expect(
                            (searchField === "department"
                                ? role.department.name
                                : role.name
                            ).toLowerCase()
                        ).toContain(searchItem.toString().toLowerCase());
                    }
                }
            );
        });

        test("Filtering", async () => {
            const departmentId = (
                await connection.manager.findOneOrFail(Department, {
                    where: { name: adminDepartmentName },
                })
            ).id;

            await readManyRoles.call(readManyRoles, baseWorld, {
                query: {
                    filterIds: [departmentId],
                },
            });

            Request.succeeded.call(baseWorld, {
                auth: false,
                status: /^200$/,
            });

            const res = baseWorld.getCustomProp<RoleResponse[]>("responseData");

            // Because we are only creating one extra user
            expect(res.length).toBeGreaterThanOrEqual(1);

            for (const item of res) {
                expect(item.department.id).toBe(departmentId);
            }
        });

        test("read one role", async () => {
            await readOneRole.call(readOneRole, baseWorld, roleId);

            Request.succeeded.call(baseWorld, { auth: false });

            const retrievedRole =
                baseWorld.getCustomProp<RoleResponse>("responseData");

            // get current role id to check details on
            const role = await connection.manager.findOneOrFail(Role, {
                where: { id: roleId },
            });

            expect(retrievedRole.name).toBe(role.name);

            const department = await connection.manager.findOneOrFail(
                Department,
                {
                    where: { id: role.department_id },
                }
            );

            expect(retrievedRole.department.name).toBe(department.name);

            const permissions = await connection.manager.findOneOrFail(
                Permission,
                {
                    where: { id: role.permission_id },
                }
            );

            for (const [key, value] of Object.entries(
                retrievedRole.permissions
            )) {
                if (
                    !(permissions[key as keyof Permission] instanceof Date) &&
                    value !== null
                ) {
                    expect(
                        permissions[key as keyof Permission].toString()
                    ).toBe(value.toString());
                }
            }
        });

        test("read multiple roles", async () => {
            await readManyRoles.call(readManyRoles, baseWorld);

            Request.succeeded.call(baseWorld, { auth: false });

            const responseData =
                baseWorld.getCustomProp<RoleResponse[]>("responseData");

            // check that the default Admin department is the first
            // we can compare others but there will be other tests for this route about sorting and filtering
            expect(responseData.length).toBeGreaterThanOrEqual(2);

            const found = responseData.find((r) => r.name === roleName);

            if (!found)
                throw new Error("Could not find role with name " + roleName);

            expect(found.department.name).toBe(adminDepartmentName);
        });

        describe("Update department", () => {
            let departmentId: number;
            let originalId: number;

            beforeEach(async () => {
                // Create department
                departmentId = await createDepartment.call(baseWorld, "TEST");
                originalId = (
                    await connection.manager.findOneOrFail(Role, roleId)
                ).department_id;
            });
            afterEach(async () => {
                await connection.manager.update(
                    Role,
                    { id: roleId },
                    { department_id: originalId }
                );
            });
            test("Update role", async () => {
                await editRole.call(
                    editRole,
                    baseWorld,
                    { id: roleId, department_id: departmentId },
                    true
                );
                Request.succeeded.call(baseWorld, {
                    auth: false,
                    status: /^200$/,
                });

                await connection.manager.findOneOrFail(Role, {
                    where: { id: roleId, department_id: departmentId },
                });
            });
        });

        describe("Update name", () => {
            let originalName: string;

            beforeEach(async () => {
                // Create department
                originalName = (
                    await connection.manager.findOneOrFail(Role, roleId)
                ).name;
            });
            afterEach(async () => {
                await connection.manager.update(
                    Role,
                    { id: roleId },
                    { name: originalName }
                );
            });
            test("Update role", async () => {
                const newName = "Noah's test role";
                await editRole.call(
                    editRole,
                    baseWorld,
                    { id: roleId, name: newName },
                    true
                );
                Request.succeeded.call(baseWorld, {
                    auth: false,
                    status: /^200$/,
                });

                await connection.manager.findOneOrFail(Role, {
                    where: { id: roleId },
                });

                Request.succeeded.call(baseWorld, {
                    auth: false,
                });

                await connection.manager.findOneOrFail(Role, {
                    where: { id: roleId, name: newName },
                });
            });
        });
    });
});
