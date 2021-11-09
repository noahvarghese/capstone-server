import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import actions from "@test/helpers/api/test-actions";
import {
    assignUserToRole,
    createDepartment,
    createRole,
    getAdminUserId,
    getBusiness,
    getDepartmentInBusiness,
    loginUser,
} from "@test/helpers/api/setup-actions";
import Request from "@test/helpers/api/request";
import Department from "@models/department";

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
    baseWorld.resetProps();
});

describe("Global admin authorized", () => {
    beforeEach(async () => {
        // Given I am logged in as an admin
        await actions.login.call(baseWorld);
    });

    test("Global admin can create department", async () => {
        // When I create a department
        await actions.createDepartment.call(baseWorld);
        // Then a new department exists
        Request.succeeded.call(baseWorld, { auth: false });
    });

    // Scenario: Global Admin Can Delete Department
    test("Global admin can delete department", async () => {
        //     Given I am logged in as an admin
        // And there is an empty department
        const id = await createDepartment.call(baseWorld, "test");

        //     When I delete a department
        await actions.deleteDepartment.call(baseWorld, [id]);

        //     Then a department is deleted
        Request.succeeded.call(baseWorld, { auth: false });
        const connection = baseWorld.getConnection();
        const count = await connection.manager.count(Department, {
            where: { id },
        });
        expect(count).toBe(0);
    });

    test("Deleting a department that has users still associated fails", async () => {
        // Given there is a department with users associated
        const department_id = await getDepartmentInBusiness.call(
            baseWorld,
            "Admin",
            await getBusiness.call(baseWorld)
        );

        // When a user tries to delete that department
        await actions.deleteDepartment.call(baseWorld, [department_id]);

        // It is not deleted
        Request.failed.call(baseWorld, {
            include404: false,
            status: /^400$/,
            message:
                /^there are users associated with this department, please reassign them$/i,
        });
    });
});

describe("User who lacks CRUD rights", () => {
    test("User who lacks CRUD department rights cannot create departments", async () => {
        // Given I am logged in as a user
        await loginUser.call(baseWorld);
        // When I create a department
        await actions.createDepartment.call(baseWorld);
        // Then I get an error
        Request.failed.call(baseWorld);
    });

    // Scenario: User who lacks CRUD department rights cannot delete departments
    test("User who lacks CRUD rights cannot delete department", async () => {
        await actions.login.call(baseWorld);
        const roleId = await createRole.call(baseWorld, "test", "Admin");
        const departmentId = await createDepartment.call(baseWorld, "test");

        //     Given I am logged in as a user
        const user = await loginUser.call(baseWorld);
        const admin = await getAdminUserId.call(baseWorld);
        await assignUserToRole.call(baseWorld, user.id, roleId, admin, true);

        //     When I delete a department
        await actions.deleteDepartment.call(baseWorld, [departmentId]);

        //     Then I get an error
        Request.failed.call(baseWorld, {
            include404: false,
            status: /^403$/,
            message: /^Insufficient permissions$/i,
        });
    });
});
