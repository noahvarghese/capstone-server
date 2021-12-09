import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import Request from "@test/api/helpers/request";
import Role from "@models/role";
import {
    createDepartment,
    createRole,
    getAdminUserId,
    getBusiness,
    getDepartmentInBusiness,
    getRoleInDepartment,
} from "@test/api/helpers/setup-actions";
import Permission, {
    EmptyPermissionAttributes,
    PermissionAttributes,
} from "@models/permission";
import { RoleResponse } from ".";
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

jest.setTimeout(5000000);

let baseWorld: BaseWorld;
const ROLE_NAME = "TEST";

type PermissionTestAttributes = Omit<
    PermissionAttributes,
    "updated_by_user_id"
>;

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Helpers.Api.setup(baseWorld, "@setup_invite_member");
});

afterEach(async () => {
    await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
});

describe("Global admin authorized", () => {
    beforeEach(async () => {
        // Given I am logged in as an admin
        await login.call(login, baseWorld);
    });

    test("Global admin can create role", async () => {
        // When I create a role

        await createRoleAction.call(createRoleAction, baseWorld);
        // Then a new role exists
        Request.succeeded.call(baseWorld, { auth: false });
    });

    // Scenario: Global Admin Can Delete Role
    test("Global admin can delete role", async () => {
        //     Given I am logged in as an admin
        // create role to delete
        const id = await createRole.call(baseWorld, ROLE_NAME, "Admin");

        //     When I delete a role
        await deleteRole.call(deleteRole, baseWorld, [id]);

        //     Then a role is deleted
        Request.succeeded.call(baseWorld, { auth: false });
        const connection = baseWorld.getConnection();
        const count = await connection.manager.count(Role, {
            where: { id },
        });
        expect(count).toBe(0);
    });

    test("Deleting a role that has users still associated fails", async () => {
        // Given there is a role with users associated
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

    describe("requires a premade role", () => {
        beforeEach(async () => {
            // Given there is a role
            const roleId = await createRole.call(baseWorld, ROLE_NAME, "Admin");
            const permission: PermissionTestAttributes = {
                dept_crud_role: true,
                global_view_reports: true,
                global_crud_users: true,
                global_crud_role: true,
                global_crud_resources: true,
                global_crud_department: true,
                global_assign_users_to_role: true,
                global_assign_users_to_department: true,
                global_assign_resources_to_role: true,
                dept_assign_resources_to_role: true,
                dept_assign_users_to_role: true,
                dept_crud_resources: true,
                dept_view_reports: true,
                global_assign_resources_to_department: true,
            };

            baseWorld.setCustomProp<number>("roleId", roleId);
            baseWorld.setCustomProp<PermissionTestAttributes>(
                "permission",
                permission
            );
        });

        test("Pagination", async () => {
            // request first page
            await readManyRoles.call(readManyRoles, baseWorld, {
                query: { page: 1, limit: 1 },
            });
            Request.succeeded.call(baseWorld, { auth: false, status: /^200$/ });

            const res1 =
                baseWorld.getCustomProp<RoleResponse[]>("responseData");

            // request second page
            await readManyRoles.call(readManyRoles, baseWorld, {
                query: { page: 2, limit: 1 },
            });
            Request.succeeded.call(baseWorld, { auth: false, status: /^200$/ });

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
                    expect(res.length).toBeGreaterThan(1);
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

        describe("Filtering", () => {
            beforeEach(async () => {
                // create test department
                const departmentId = await createDepartment.call(
                    baseWorld,
                    ROLE_NAME
                );

                const roleId = await createRole.call(
                    baseWorld,
                    ROLE_NAME,
                    ROLE_NAME,
                    {
                        ...EmptyPermissionAttributes(),
                        updated_by_user_id: await getAdminUserId.call(
                            baseWorld
                        ),
                    }
                );

                baseWorld.setCustomProp("departmentId", departmentId);
                baseWorld.setCustomProp("roleId", roleId);
            });
            test("Filtering", async () => {
                const departmentId = baseWorld.getCustomProp("departmentId");

                await readManyRoles.call(readManyRoles, baseWorld, {
                    query: {
                        filterIds: [departmentId],
                    },
                });

                Request.succeeded.call(baseWorld, {
                    auth: false,
                    status: /^200$/,
                });

                const res =
                    baseWorld.getCustomProp<RoleResponse[]>("responseData");

                // Because we are only creating one extra user
                expect(res.length).toBe(1);

                for (const item of res) {
                    expect(item.department.id).toBe(departmentId);
                }
            });
        });

        test("User who has CRUD rights can read singular role", async () => {
            const roleId = baseWorld.getCustomProp<number>("roleId");

            await readOneRole.call(readOneRole, baseWorld, roleId);
            Request.succeeded.call(baseWorld, { auth: false });
            const retrievedRole =
                baseWorld.getCustomProp<RoleResponse>("responseData");

            // get current role id to check details on
            const role = await baseWorld
                .getConnection()
                .manager.findOneOrFail(Role, { where: { id: roleId } });

            expect(retrievedRole.name).toBe(role.name);

            const department = await baseWorld
                .getConnection()
                .manager.findOneOrFail(Department, {
                    where: { id: role.department_id },
                });
            expect(retrievedRole.department.name).toBe(department.name);

            const permissions = await baseWorld
                .getConnection()
                .manager.findOneOrFail(Permission, {
                    where: { id: role.permission_id },
                });

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

        test("User who has CRUD rights can read multiple roles", async () => {
            await readManyRoles.call(readManyRoles, baseWorld);
            Request.succeeded.call(baseWorld, { auth: false });
            const responseData =
                baseWorld.getCustomProp<RoleResponse[]>("responseData");

            // check that the default Admin department is the first
            // we can compare others but there will be other tests for this route about sorting and filtering
            expect(responseData.length).toBeGreaterThanOrEqual(1);

            const found = responseData.find((r) => r.name === ROLE_NAME);

            if (!found)
                throw new Error("Could not find role with name " + ROLE_NAME);
            expect(found.department.name).toBe("Admin");
        });

        test("User who has CRUD rights can reassign role to different department", async () => {
            const roleId = baseWorld.getCustomProp<number>("roleId");
            const connection = baseWorld.getConnection();
            const prevRole = await connection.manager.findOne(Role, roleId);

            if (!prevRole) throw new Error("Role not defined");

            const department_id = await createDepartment.call(
                baseWorld,
                "TEST"
            );

            await editRole.call(
                editRole,
                baseWorld,
                { id: roleId, department_id },
                true
            );
            Request.succeeded.call(baseWorld, { auth: false, status: /^200$/ });

            const currRole = await connection.manager.findOne(Role, roleId);
            if (!currRole) throw new Error("Role not defined");

            expect(prevRole.department_id).not.toBe(currRole.department_id);
        });

        test("User who has CRUD rights can change role name", async () => {
            const roleId = baseWorld.getCustomProp<number>("roleId");
            const permissions =
                baseWorld.getCustomProp<PermissionTestAttributes>("permission");

            // When a user tries to edit that role
            const newName = "Noah's test role";
            await editRole.call(
                editRole,
                baseWorld,
                {
                    name: newName,
                    permissions,
                    id: roleId,
                },
                true
            );

            // Then the department is not updated
            Request.succeeded.call(baseWorld, {
                auth: false,
            });

            const updatedRole = await baseWorld
                .getConnection()
                .manager.findOneOrFail(Role, {
                    where: { id: roleId },
                });

            const updatedPermissions = await baseWorld
                .getConnection()
                .manager.findOneOrFail(Permission, {
                    where: { id: updatedRole.permission_id },
                });

            expect(updatedRole.name).toBe(newName);

            for (const [key, value] of Object.entries(permissions)) {
                expect(updatedPermissions[key as keyof Permission]).toBe(value);
            }
        });
    });
});
