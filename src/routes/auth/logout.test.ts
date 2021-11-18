import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import actions from "@test/api/actions";

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
    await Helpers.Api.setup.call(baseWorld, "@setup_logout");
});

afterEach(async () => {
    await Helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
    baseWorld.resetProps();
});

test("Logout authenticated user", async () => {
    await actions.logout(baseWorld);

    const cookies = baseWorld.getCustomProp<string>("cookies");
    const expiredCookie = /Expires=Thu, 01 Jan 1970 00:00:00 GMT$/;
    expect(expiredCookie.test(cookies)).toBe(true);
});
