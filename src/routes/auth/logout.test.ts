import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import actions from "@test/helpers/api/actions";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    await Helpers.Api.setup.call(baseWorld, "@setup_logout");
});

afterEach(async () => {
    await Helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
});

test("Logout authenticated user", async () => {
    await actions.logout.call(baseWorld);

    const cookies = baseWorld.getCustomProp<string>("cookies");
    const expiredCookie = /Expires=Thu, 01 Jan 1970 00:00:00 GMT$/;
    expect(expiredCookie.test(cookies)).toBe(true);
});
