import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import actions from "@test/helpers/api/test-actions";
import Request from "@test/helpers/api/request";
import Role from "@models/role";
import {
    assignUserToRole,
    createRole,
    getAdminUserId,
    getBusiness,
    getDepartmentInBusiness,
    getRoleInDepartment,
    loginUser,
} from "@test/helpers/api/setup-actions";
import Permission, { PermissionAttributes } from "@models/permission";
import { RoleResponse } from ".";
import Department from "@models/department";

let baseWorld: BaseWorld;
type PermissionTestAttributes = Omit<
    PermissionAttributes,
    "updated_by_user_id"
>;

beforeAll(async () => {
    await DBConnection.init();
    await Helpers.AppServer.setup(false);
});
afterAll(async () => {
    await Helpers.AppServer.teardown();
    await DBConnection.close();
});

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Helpers.Api.setup.call(baseWorld, "@setup_invite_user");
});

afterEach(async () => {
    await Helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
});

describe("Global admin authorized", () => {
    beforeEach(async () => {
        // Given I am logged in as an admin
        await actions.login.call(baseWorld);
    });

    test("Global admin can create role", async () => {
        // When I create a role
        await actions.createRole.call(baseWorld);
        // Then a new role exists
        Request.succeeded.call(baseWorld, { auth: false });
    });

    // Scenario: Global Admin Can Delete Role
    test("Global admin can delete role", async () => {
        //     Given I am logged in as an admin
        // create role to delete
        const id = await createRole.call(baseWorld, "test", "Admin");

        //     When I delete a role
        await actions.deleteRole.call(baseWorld, [id]);

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
        await actions.deleteRole.call(baseWorld, [role_id]);

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
            const roleId = await createRole.call(baseWorld, "test", "Admin");
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

        test("User who has CRUD rights can read singular role", async () => {
            const roleId = baseWorld.getCustomProp<number>("roleId");

            await actions.readOneRole.call(baseWorld, roleId);
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
            await actions.readManyRoles.call(baseWorld);
            Request.succeeded.call(baseWorld, { auth: false });
            const data = baseWorld.getCustomProp<{
                data: {
                    id: number;
                    name: string;
                    numMembers: string;
                    department: string;
                }[];
            }>("responseData");
            const responseData = data.data;

            // check that the default Admin department is the first
            // we can compare others but there will be other tests for this route about sorting and filtering
            expect(responseData.length).toBeGreaterThanOrEqual(1);
            expect(responseData[0].name).toBe("General");
            expect(responseData[0].department).toBe("Admin");
            expect(responseData[0].numMembers).toBe("1");
        });

        test("User who has CRUD rights can edit role", async () => {
            const roleId = baseWorld.getCustomProp<number>("roleId");
            const permission =
                baseWorld.getCustomProp<PermissionTestAttributes>("permission");

            // When a user tries to edit that role
            const newName = "Noah's test role";
            await actions.editRole.call(
                baseWorld,
                newName,
                permission,
                roleId,
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

            for (const [key, value] of Object.entries(permission)) {
                expect(updatedPermissions[key as keyof Permission]).toBe(value);
            }
        });
    });
});

describe("User who lacks CRUD rights", () => {
    test("User who lacks CRUD role rights cannot create roles", async () => {
        // Given I am logged in as a user
        await loginUser.call(baseWorld);
        // When I create a role
        await actions.createRole.call(baseWorld);
        // Then I get an error
        Request.failed.call(baseWorld);
    });

    // Scenario: User who lacks CRUD role rights cannot delete roles
    test("User who lacks CRUD rights cannot delete role", async () => {
        await actions.login.call(baseWorld);
        const assignedRoleId = await createRole.call(
            baseWorld,
            "assigned",
            "Admin"
        );

        //     Given I am logged in as a user
        const user = await loginUser.call(baseWorld);
        const admin = await getAdminUserId.call(baseWorld);
        await assignUserToRole.call(
            baseWorld,
            user.id,
            assignedRoleId,
            admin,
            true
        );

        // And there is a role without any members
        const roleId = await createRole.call(baseWorld, "test", "Admin");
        //     When I delete a role
        await actions.deleteRole.call(baseWorld, [roleId]);

        //     Then I get an error
        Request.failed.call(baseWorld, {
            include404: false,
            status: /^403$/,
            message: /^Insufficient permissions$/i,
        });
    });

    test("User who lacks CRUD rights cannot edit role", async () => {
        // Given there is a user setup without crud permissions
        await actions.login.call(baseWorld);
        const assignedRoleId = await createRole.call(
            baseWorld,
            "assigned",
            "Admin"
        );

        //     Given I am logged in as a user
        const user = await loginUser.call(baseWorld);
        const admin = await getAdminUserId.call(baseWorld);
        await assignUserToRole.call(
            baseWorld,
            user.id,
            assignedRoleId,
            admin,
            true
        );

        // And there is a role
        const roleId = await createRole.call(baseWorld, "test", "Admin");
        const permission: Omit<PermissionAttributes, "updated_by_user_id"> = {
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

        // When a user tries to edit that role
        const newName = "Noah's test role";
        await actions.editRole.call(baseWorld, newName, permission, roleId);

        // Then the department is not updated
        Request.failed.call(baseWorld, {
            include404: false,
            message: /^insufficient permissions$/i,
            status: /^403$/,
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

        expect(updatedRole.name).not.toBe(newName);

        for (const [key, value] of Object.entries(permission)) {
            expect(updatedPermissions[key as keyof Permission]).not.toBe(value);
        }
    });

    test.todo("User who has CRUD rights cannot read multiple roles");
    test.todo("User who has CRUD rights cannot read a singular role");
});
