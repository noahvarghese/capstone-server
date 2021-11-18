import BaseWorld from "@test/support/base_world";
import Helpers from "@test/helpers";
import actions from "@test/api/actions";
import Request from "@test/api/helpers/request";
import DBConnection from "@test/support/db_connection";

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
    await Helpers.Api.setup.call(baseWorld, "@setup_auth_check");
});

afterEach(async () => {
    await Helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
    baseWorld.resetProps();
});

test("Authenticated user revisiting", async () => {
    // Given I have been authenticated
    await actions.login(baseWorld);
    // When I check if I am authenticated
    await actions.authCheck(baseWorld);
    // Then a confirmation is returned
    Request.succeeded.call(baseWorld, { auth: false });
});

test("Unauthenticated user revisiting", async () => {
    // Given I have not been authenticated
    baseWorld.setCustomProp<string>("cookies", "");
    // When I check if I am authenticated
    await actions.authCheck(baseWorld);
    // Then an error is returned
    Request.failed.call(baseWorld);
});
