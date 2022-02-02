import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import Form from "@test/api/helpers/form";
import urls from "@test/api/urls";
import User from "@models/user/user";
import attributes from "@test/api/attributes";
import { apiRequest } from "@test/api/actions";
import {
    ForgotPasswordProps,
    ResetPasswordProps,
} from "@test/api/attributes/password";

let baseWorld: BaseWorld;

const { email } = attributes.forgotPassword() as ForgotPasswordProps;
const { password } = attributes.resetPassword() as ResetPasswordProps;

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
    await Helpers.Api.setup(baseWorld, "@setup_reset_password");
});

afterEach(async () => {
    await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
    baseWorld.resetProps();
});

describe("Reset password", () => {
    async function resetPassword(this: BaseWorld) {
        Form.load(this, "resetPassword");

        const invalid_token = this.getCustomProp<string | undefined>(
            "invalid_token"
        );

        const invalid_password = this.getCustomProp<string | undefined>(
            "invalid_password"
        );

        const connection = this.getConnection();
        const { token } = await connection.manager.findOneOrFail(User, {
            where: {
                email,
            },
        });

        const url = (urls.resetPassword as (t: string) => string)(
            invalid_token ?? token ?? ""
        );

        if (invalid_password) {
            this.setCustomProp<ResetPasswordProps>("body", {
                ...this.getCustomProp<ResetPasswordProps>("body"),
                confirm_password: invalid_password,
            });
        }

        await Form.submit(this, url, true, false);
    }

    beforeEach(async () => {
        await apiRequest(baseWorld, "forgotPassword", {
            cookie: { withCookie: false, saveCookie: false },
        });
    });

    test("Valid reset", async () => {
        await resetPassword.call(baseWorld);
        const connection = baseWorld.getConnection();
        const user = await connection.manager.findOneOrFail(User, {
            where: {
                email,
            },
        });
        expect(await user.comparePassword(password)).toBe(true);
        expect(user.token).toBe(null);
        expect(user.token_expiry).toBe(null);
    });

    test("Passwords do not match", async () => {
        baseWorld.setCustomProp<string>("invalid_password", "invalid_password");
        await resetPassword.call(baseWorld);

        const connection = baseWorld.getConnection();
        const user = await connection.manager.findOneOrFail(User, {
            where: {
                email,
            },
        });
        expect(await user.comparePassword(password)).toBe(false);
        expect(user.token).not.toBe(null);
        expect(user.token_expiry).not.toBe(null);
    });
});