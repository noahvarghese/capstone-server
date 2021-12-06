import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import { forgotPassword } from "@test/api/actions/password";
import Request from "@test/api/helpers/request";

let baseWorld: BaseWorld;

beforeEach(async () => {
    await DBConnection.init();
    await Helpers.AppServer.setup(false);
    baseWorld = new BaseWorld(await DBConnection.get());
});

afterEach(async () => {
    baseWorld.resetProps();
    await Helpers.AppServer.teardown();
    await DBConnection.close();
});

test("Forgot Password Token Created", async () => {
    await forgotPassword.call(forgotPassword, baseWorld);
    Request.failed.call(baseWorld, {
        include404: false,
        status: /^400$/,
        message: /^invalid email$/i,
    });
});
