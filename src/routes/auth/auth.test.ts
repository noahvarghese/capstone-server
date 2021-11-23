import BaseWorld from "@test/support/base_world";
import Helpers from "@test/helpers";
import Request from "@test/api/helpers/request";
import DBConnection from "@test/support/db_connection";
import { authCheck, login } from "@test/api/actions/auth";

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
    await Helpers.Api.setup(baseWorld, "@setup_auth_check");
});

afterEach(async () => {
    await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
    baseWorld.resetProps();
});

test("Authenticated user revisiting", async () => {
    // Given I have been authenticated
    await login.call(login, baseWorld);
    // When I check if I am authenticated
    await authCheck.call(authCheck, baseWorld);
    // Then a confirmation is returned
    Request.succeeded.call(baseWorld, { auth: false });
});

test("Unauthenticated user revisiting", async () => {
    // Given I have not been authenticated
    baseWorld.setCustomProp<string>("cookies", "");
    // When I check if I am authenticated
    await authCheck.call(authCheck, baseWorld);
    // Then an error is returned
    Request.failed.call(baseWorld);
});
