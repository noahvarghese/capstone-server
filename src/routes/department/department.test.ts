import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import actions from "@test/helpers/api/test-actions";
import { createDepartment, loginUser } from "@test/helpers/api/setup-actions";
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
});

describe("User who lacks CRUD rights", () => {
    // Given I am logged in as a user
    beforeEach(async () => await loginUser.call(baseWorld));

    test("User who lacks CRUD department rights cannot create departments", async () => {
        // When I create a department
        await actions.createDepartment.call(baseWorld);
        // Then I get an error
        Request.failed.call(baseWorld);
    });
    test.todo("User who lacks CRUD rights cannot delete department");
    // Scenario: User who lacks CRUD department rights cannot delete departments
    //     Given I am logged in as a user
    //     When I delete a department
    //     Then I get an error
});
