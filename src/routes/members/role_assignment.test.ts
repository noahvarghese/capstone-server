import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import { login } from "@test/api/actions/auth";
import {
    assignUserToRole,
    createDepartment,
    createRegularUser,
    createRole,
    getAdminUserId,
    loginUser,
} from "@test/api/helpers/setup-actions";
import { EmptyPermissionAttributes } from "@models/permission";
import { roleAssignment, roleRemoval } from "@test/api/actions/members";
import Request from "@test/api/helpers/request";
import UserRole from "@models/user/user_role";

let baseWorld: BaseWorld;
const name = "TEST";
jest.setTimeout(500000);

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
    await Helpers.Api.setup(baseWorld, "@setup_invite_member");
    // Given I am logged in as an admin
    await login.call(login, baseWorld);
});

afterEach(async () => {
    await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
});

describe("Global admin authorized", () => {
    beforeEach(async () => {
        const adminId = await getAdminUserId.call(baseWorld);

        // Create role to assign user to
        await createDepartment.call(baseWorld, name);
        const roleId = await createRole.call(baseWorld, name, name, {
            ...EmptyPermissionAttributes(),
            updated_by_user_id: adminId,
        });

        // Given I am logged in as a user
        const user = await createRegularUser.call(baseWorld);
        // store data for test usage
        baseWorld.setCustomProp("adminId", adminId);
        baseWorld.setCustomProp("user", user);
        baseWorld.setCustomProp("roleId", roleId);
    });

    test("Can assign user to role(s)", async () => {
        const { id } = baseWorld.getCustomProp<{ id: number }>("user");
        const role_id = baseWorld.getCustomProp<number>("roleId");
        const connection = baseWorld.getConnection();

        await roleAssignment.call(roleAssignment, baseWorld, id, [role_id]);
        Request.succeeded.call(baseWorld);

        const userRole = await connection.manager.findOne(UserRole, {
            where: { user_id: id, role_id },
        });
        expect(userRole).not.toBe(undefined);
    });

    test("Can remove user role", async () => {
        const { id } = baseWorld.getCustomProp<{ id: number }>("user");
        const role_id = baseWorld.getCustomProp<number>("roleId");
        const adminId = baseWorld.getCustomProp<number>("minId");
        const connection = baseWorld.getConnection();

        // given user is assigned to a role
        await assignUserToRole.call(baseWorld, id, role_id, adminId, true);

        // when the role is removed
        await roleRemoval.call(roleRemoval, baseWorld, id, [role_id]);

        // The request is successful
        Request.succeeded.call(baseWorld);

        const userRole = await connection.manager.findOne(UserRole, {
            where: { user_id: id, role_id },
        });

        // user role should be deleted
        expect(userRole).toBe(undefined);
    });
});

describe("User who lacks CRUD rights", () => {
    beforeEach(async () => {
        const adminId = await getAdminUserId.call(baseWorld);
        baseWorld.setCustomProp("adminId", adminId);

        await createDepartment.call(baseWorld, name);
        const roleId = await createRole.call(baseWorld, name, name, {
            ...EmptyPermissionAttributes(),
            updated_by_user_id: adminId,
        });

        // Given I am logged in as a user
        const user = await createRegularUser.call(baseWorld);
        baseWorld.setCustomProp("user", user);
        baseWorld.setCustomProp("roleId", roleId);
        // given user is assigned to a role
        await assignUserToRole.call(baseWorld, user.id, roleId, adminId, true);
        // login as unauth user
        await loginUser.call(baseWorld);
    });

    test("Cannot add user to role(s)", async () => {
        const adminId = baseWorld.getCustomProp<number>("adminId");
        const roleId = baseWorld.getCustomProp<number>("roleId");

        await roleAssignment.call(roleAssignment, baseWorld, adminId, [roleId]);

        Request.failed.call(baseWorld, {
            include404: false,
            status: /^403$/,
            message: /^insufficient permissions$/i,
        });
    });

    test("Cannot remove user role", async () => {
        const { id } = baseWorld.getCustomProp<{ id: number }>("user");
        const role_id = baseWorld.getCustomProp<number>("roleId");
        const connection = baseWorld.getConnection();

        // when the role is removed
        await roleRemoval.call(roleRemoval, baseWorld, id, [role_id]);

        // The request is not successful
        Request.failed.call(baseWorld, {
            status: /^403$/,
            message: /^Insufficient permissions$/i,
            include404: false,
        });

        const userRole = await connection.manager.findOne(UserRole, {
            where: { user_id: id, role_id },
        });

        // user role should not be deleted
        expect(userRole).not.toBe(undefined);
    });
});
