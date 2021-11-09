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

let baseWorld: BaseWorld;

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
        const roleId = await createRole.call(baseWorld, "test", "Admin");

        //     Given I am logged in as a user
        const user = await loginUser.call(baseWorld);
        const admin = await getAdminUserId.call(baseWorld);
        await assignUserToRole.call(baseWorld, user.id, roleId, admin, true);
        //     When I delete a role
        await actions.deleteRole.call(baseWorld, [roleId]);

        //     Then I get an error
        Request.failed.call(baseWorld, {
            include404: false,
            status: /^403$/,
            message: /^Insufficient permissions$/i,
        });
    });
});
