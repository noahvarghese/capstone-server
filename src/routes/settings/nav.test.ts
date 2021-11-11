import helpers from "@test/helpers";
import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";

let baseWorld: BaseWorld;

beforeAll(async () => {
    await DBConnection.init();
    await helpers.AppServer.setup(false);
});

afterAll(async () => {
    await helpers.AppServer.teardown();
    await DBConnection.close();
});

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await helpers.Api.setup.call(baseWorld, "@setup_invite_user");
});

afterEach(async () => {
    await helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
});

test.todo("user with no permissions has less nav options");
test.todo("user with all permissions has all nav options");
