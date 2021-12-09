import BaseWorld from "@test/support/base_world";
import User from "@models/user/user";
import Helpers from "@test/helpers";
import Request from "@test/api/helpers/request";
import DBConnection from "@test/support/db_connection";
import { authCheck, login, logout } from "@test/api/actions/auth";
import { inviteMember } from "@test/api/actions/members";
import attributes from "@test/api/attributes";
import { apiRequest } from "@test/api/actions";
import { LoginProps } from "./login";
import { InviteMemberProps } from "@services/data/user";
import { forgotPassword } from "@test/api/actions/password";

let baseWorld: BaseWorld;

beforeAll(async () => {
    await Helpers.AppServer.setup(false);
});

afterAll(async () => {
    await Helpers.AppServer.teardown();
});

beforeEach(async () => {
    await DBConnection.init();
    baseWorld = new BaseWorld(await DBConnection.get());
});

afterEach(async () => {
    baseWorld.resetProps();
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

describe("requires model teardown", () => {
    afterEach(async () => {
        await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
    });
    describe("auth check", () => {
        beforeEach(async () => {
            await Helpers.Api.setup(baseWorld, "@setup_auth_check");
        });

        test("Authenticated user revisiting", async () => {
            // Given I have been authenticated
            await login.call(login, baseWorld);
            // When I check if I am authenticated
            await authCheck.call(authCheck, baseWorld);
            // Then a confirmation is returned
            Request.succeeded.call(baseWorld, { auth: false });
        });

        test("Unauthenticated user revisiting", async () => {
            // Given I have not been authenticated
            baseWorld.setCustomProp<string>("cookies", "");
            // When I check if I am authenticated
            await authCheck.call(authCheck, baseWorld);
            // Then an error is returned
            Request.failed.call(baseWorld);
        });
    });

    describe("Login with user that has not accepted an invite", () => {
        beforeEach(async () => {
            await Helpers.Api.setup(baseWorld, "@setup_login");
        });

        beforeEach(async () => {
            jest.setTimeout(20000);
            // login as user with permissions to invite user
            await login.call(login, baseWorld);
            // create new user and send invitation
            await inviteMember.call(inviteMember, baseWorld, "new");

            // hash plaintext password
            const { email, password } = attributes.login() as LoginProps;

            const connection = baseWorld.getConnection();
            const user = await connection.manager.findOneOrFail(User, {
                where: { email },
            });

            await connection.manager.update(
                User,
                { id: user.id },
                { password: (await user.hashPassword(password)).password }
            );
        });

        test("Valid credentials, but not a member", async () => {
            const { password } = attributes.login() as LoginProps;

            await apiRequest(baseWorld, "login", {
                cookie: { withCookie: false, saveCookie: true },
                errorOnFail: false,
                body: {
                    email: (attributes.inviteMember() as InviteMemberProps)
                        .email,
                    password,
                },
            });

            Request.failed.call(baseWorld);
        });
    });

    describe("Logout", () => {
        beforeEach(async () => {
            await Helpers.Api.setup(baseWorld, "@setup_logout");
        });
        test("Logout authenticated user", async () => {
            await logout.call(logout, baseWorld);

            const cookies = baseWorld.getCustomProp<string>("cookies");
            const expiredCookie = /Expires=Thu, 01 Jan 1970 00:00:00 GMT$/;
            expect(expiredCookie.test(cookies)).toBe(true);
        });
    });
});
