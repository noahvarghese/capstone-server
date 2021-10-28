import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import Form from "@test/helpers/api/form";
import { urls } from "@test/sample_data/api/dependencies";
import User from "@models/user/user";
import Event from "@models/event";
import { ForgotPasswordProps } from "@test/sample_data/api/attributes";
import attributes from "@test/sample_data/api/attributes";

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
    await Helpers.Api.setup.call(baseWorld, "@setup_forgot_password");
});

afterEach(async () => {
    await Helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
    baseWorld.resetProps();
});

test("Forgot Password Token Created", async () => {
    // Given I am registered
    Form.load.call(baseWorld, "forgotPassword");
    // When I request to reset the password
    await Form.submit.call(
        baseWorld,
        urls.forgotPassword as string,
        true,
        false
    );
    const connection = baseWorld.getConnection();
    // Then a token should be created    const connection = baseWorld.getConnection();
    let user = (
        await connection.manager.find(User, {
            where: {
                email: (attributes.forgotPassword() as ForgotPasswordProps)
                    .email,
            },
        })
    )[0];

    expect(user.token).not.toBe(null);

    // And the expiry date is correct
    // We should test the specific time it sets
    expect(user.token_expiry).not.toBe(null);
    expect(
        user.token_expiry instanceof Date
            ? user.token_expiry.getTime()
            : -Infinity
    ).toBeGreaterThan(new Date().getTime());
    // And I am sent a token    // Check that an email was sent (This requires logging of events in the database)
    // Maybe try login to email to confirm email was sent
    user = (
        await connection.manager.find(User, {
            where: {
                email: (attributes.forgotPassword() as ForgotPasswordProps)
                    .email,
            },
        })
    )[0];

    const event = (
        await connection.manager.find(Event, {
            where: { user_id: user.id, name: "Request Reset Password" },
            order: { created_on: "DESC" },
        })
    )[0];

    expect(event).toBeTruthy();

    expect(event.created_on).not.toBe(null);

    expect(event.created_on?.getUTCMilliseconds()).toBeLessThan(
        new Date().getUTCMilliseconds() - 10
    );
});
