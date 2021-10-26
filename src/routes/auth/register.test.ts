import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import Form from "@test/helpers/api/form";
import { urls } from "@test/sample_data/api/dependencies";
import Request from "@test/helpers/api/request";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    await Helpers.Api.setup.call(baseWorld, "@setup_register_business");
});

afterEach(async () => {
    await Helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
});

test("", async () => {
    Form.load.call(baseWorld, "registerBusiness");

    await Form.submit.call(
        baseWorld,
        urls.registerBusiness as string,
        true,
        false
    );

    Request.succeeded.call(baseWorld);
});
