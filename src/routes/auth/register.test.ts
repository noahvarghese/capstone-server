import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import Form from "@test/api/helpers/form";
import urls from "@test/api/urls";
import Request from "@test/api/helpers/request";
import { apiRequest } from "@test/api/actions";
import attributes from "@test/api/attributes";

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
