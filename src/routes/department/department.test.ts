import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import actions from "@test/helpers/api/actions";
import { loginUser } from "@test/util/actions";
import Request from "@test/helpers/api/request";

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

    test.todo("Global admin can delete department");
    // Scenario: Global Admin Can Delete Department
    //     Given I am logged in as an admin
    //     When I delete a department
    //     Then a department is deleted
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
