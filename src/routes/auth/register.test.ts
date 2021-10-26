import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import Form from "@test/helpers/api/form";
import { urls } from "@test/sample_data/api/dependencies";
import Request from "@test/helpers/api/request";
import { apiRequest } from "@test/helpers/api/actions";
import attributes from "@test/sample_data/api/attributes";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    await Helpers.Api.setup.call(baseWorld, "@setup_register_business");
});
afterEach(async () => {
    baseWorld.resetProps();
});

describe("Business created", () => {
    afterEach(async () => {
        await Helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
    });

    test("Valid inputs", async () => {
        Form.load.call(baseWorld, "registerBusiness");

        await Form.submit.call(
            baseWorld,
            urls.registerBusiness as string,
            true,
            false
        );

        Request.succeeded.call(baseWorld);
    });
});

test("Invalid email", async () => {
    await apiRequest.call(baseWorld, "registerBusiness", {
        cookie: { withCookie: false, saveCookie: true },
        errorOnFail: false,
        body: {
            ...attributes.registerBusiness(),
            email: "invalid",
        },
    });

    Request.failed.call(baseWorld, {
        include404: false,
        status: /^400$/,
        message: "Invalid email",
    });
});

test("Empty field", async () => {
    await apiRequest.call(baseWorld, "registerBusiness", {
        cookie: { withCookie: false, saveCookie: true },
        errorOnFail: false,
        body: {
            ...attributes.registerBusiness(),
            email: "",
        },
    });

    Request.failed.call(baseWorld, {
        include404: false,
        status: /^400$/,
        message: /^email cannot be empty$/i,
    });
});
