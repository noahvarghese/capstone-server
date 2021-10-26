import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import actions from "@test/helpers/api/actions";
import { loginUser } from "@test/util/actions";
import Request from "@test/helpers/api/request";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
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
        Request.succeeded.call(baseWorld);
    });

    test.todo("Global admin can delete role");
    // Scenario: Global Admin Can Delete Role
    //     Given I am logged in as an admin
    //     When I delete a role
    //     Then a role is deleted
});

describe("User who lacks CRUD rights", () => {
    // Given I am logged in as a user
    beforeEach(async () => await loginUser.call(baseWorld));

    test("User who lacks CRUD role rights cannot create roles", async () => {
        // When I create a role
        await actions.createRole.call(baseWorld);
        // Then I get an error
        Request.failed.call(baseWorld);
    });
    test.todo("User who lacks CRUD rights cannot delete role");
    // Scenario: User who lacks CRUD role rights cannot delete roles
    //     Given I am logged in as a user
    //     When I delete a role
    //     Then I get an error
});
