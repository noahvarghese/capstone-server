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
import { roleAssignment } from "@test/api/actions/members";
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
    });

    test("Can assign user to role(s)", async () => {
        const { id } = baseWorld.getCustomProp<{ id: number }>("user");
        const roleId = baseWorld.getCustomProp<number>("roleId");
        await roleAssignment.call(roleAssignment, baseWorld, id, [roleId]);
        Request.succeeded.call(baseWorld);
        const userRole = await baseWorld
            .getConnection()
            .manager.findOne(UserRole, { where: { user_id: id } });
        expect(userRole).not.toBe(undefined);
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
        await assignUserToRole.call(baseWorld, user.id, roleId, adminId, true);
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
});
