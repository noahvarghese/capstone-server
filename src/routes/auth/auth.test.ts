import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import actions from "@test/helpers/api/actions";
import Request from "@test/helpers/api/request";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    await Helpers.Api.setup.call(baseWorld, "@setup_auth_check");
});

afterEach(async () => {
    await Helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
});

test("Authenticated user revisiting", async () => {
    console.log("Auth");
    // Given I have been authenticated
    await actions.login.call(baseWorld);
    // When I check if I am authenticated
    await actions.authCheck.call(baseWorld);
    // Then a confirmation is returned
    Request.succeeded.call(baseWorld, { auth: false });
});

test("Unauthenticated user revisiting", async () => {
    console.log("UnAuth");
    // Given I have not been authenticated
    baseWorld.setCustomProp<string>("cookies", "");
    // When I check if I am authenticated
    await actions.authCheck.call(baseWorld);
    // Then an error is returned
    Request.failed.call(baseWorld);
});
