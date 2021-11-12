import helpers from "@test/helpers";
import Request from "@test/api/helpers/request";
import { loginUser } from "@test/api/helpers/setup-actions";
import actions from "@test/api/actions";
import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import { AdminNavLinks, DefaultNavLinks, Nav } from "./nav";

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

test("user with no permissions has less nav options", async () => {
    // Given I am logged in as a user
    await loginUser.call(baseWorld);
    // When I get the nav links
    await actions.getNav.call(baseWorld);
    // then the request is succesful
    Request.succeeded.call(baseWorld, { auth: false });
    // and i get the correct data
    const data = baseWorld.getCustomProp<DefaultNavLinks>("responseData");
    const expectedNavLinks = Nav.produceDefaultLinks();
    expect(data).toStrictEqual(expectedNavLinks);
});
test("user with all permissions has all nav options", async () => {
    // Given I am logged in as an admin
    await actions.login.call(baseWorld);
    // When I get the nav links
    await actions.getNav.call(baseWorld);
    // then the request is succesful
    Request.succeeded.call(baseWorld, { auth: false });
    // and i get the correct data
    const data = baseWorld.getCustomProp<AdminNavLinks>("responseData");
    const expectedNavLinks = Nav.produceAdminLinks();
    expect(data).toStrictEqual(expectedNavLinks);
});
