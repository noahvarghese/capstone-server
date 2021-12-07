import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import Request from "@test/api/helpers/request";
import { loginUser } from "@test/api/helpers/setup-actions";
import { inviteMember } from "@test/api/actions/members";

let baseWorld: BaseWorld;
jest.setTimeout(5000000);

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
    await Helpers.Api.setup(baseWorld, "@setup_invite_member");
});

afterEach(async () => {
    await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
    baseWorld.resetProps();
});

// This will be tested once I write middleware specific tests
describe("Sending invites to join business", () => {
    test("Non admin cannot invite user", async () => {
        // Given I am logged in as a user
        await loginUser.call(baseWorld);
        // When a new user is added to the business
        await inviteMember.call(inviteMember, baseWorld, "default");
        // Then I get an error
        Request.failed.call(baseWorld, {
            checkCookie: false,
            include404: false,
            status: /^403$/,
            message: /^insufficient permissions$/i,
        });
    });
});
