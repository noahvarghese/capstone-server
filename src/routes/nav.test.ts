import helpers from "@test/helpers";
import Request from "@test/api/helpers/request";
import { loginUser } from "@test/api/helpers/setup-actions";
import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Nav, { AdminNavLinks, DefaultNavLinks } from "@services/data/nav";
import { getNav } from "@test/api/actions/settings";
import { login } from "@test/api/actions/auth";

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
    await helpers.Api.setup(baseWorld, "@setup_invite_member");
});

afterEach(async () => {
    await helpers.Api.teardown(baseWorld, "@cleanup_user_role");
});

test("user with no permissions has less nav options", async () => {
    // Given I am logged in as a user
    await loginUser.call(baseWorld);
    // When I get the nav links
    await getNav.call(getNav, baseWorld);
    // then the request is succesful
    Request.succeeded.call(baseWorld, { auth: false });
    // and i get the correct data
    const data = baseWorld.getCustomProp<DefaultNavLinks>("responseData");
    const expectedNavLinks = Nav.produceDefaultLinks();
    expect(data).toStrictEqual(expectedNavLinks);
});

test("user with all permissions has all nav options", async () => {
    // Given I am logged in as an admin
    await login.call(login, baseWorld);
    // When I get the nav links
    await getNav.call(getNav, baseWorld);
    // then the request is succesful
    Request.succeeded.call(baseWorld, { auth: false });
    // and i get the correct data
    const data = baseWorld.getCustomProp<AdminNavLinks>("responseData");
    const expectedNavLinks = Nav.produceAdminLinks();
    expect(data).toStrictEqual(expectedNavLinks);
});
