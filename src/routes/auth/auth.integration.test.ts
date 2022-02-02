import BaseWorld from "@test/support/base_world";
import User from "@models/user/user";
import Helpers from "@test/helpers";
import Request from "@test/api/helpers/request";
import DBConnection from "@test/support/db_connection";
import { authCheck, login, logout } from "@test/api/actions/auth";
import { inviteMember } from "@test/api/actions/members";
import attributes from "@test/api/attributes";
import { apiRequest } from "@test/api/actions";
import { forgotPassword, resetPassword } from "@test/api/actions/password";
import Event from "@models/event";
import { userAttributes } from "@test/model/attributes";
import { registerBusiness } from "@test/api/actions/business";

let baseWorld: BaseWorld;

describe("Forgot password", () => {
    beforeAll(async () => {
        baseWorld = new BaseWorld(await DBConnection.get());
    });
    test("invalid email", async () => {
        await forgotPassword.call(forgotPassword, baseWorld, "invalid");
        Request.failed.call(baseWorld, {
            include404: false,
            status: /^400$/,
            message: /^invalid email$/i,
        });
    });
    describe("Valid user", () => {
        beforeEach(async () => {
            await Helpers.Api.setup(baseWorld, "@setup_forgot_password");
        });
        afterEach(async () => {
            await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
        });
        test("token created", async () => {
            const connection = baseWorld.getConnection();

            await forgotPassword.call(
                forgotPassword,
                baseWorld,
                userAttributes().email
            );

            Request.succeeded.call(baseWorld, { auth: false });

            const user = await connection.manager.findOneOrFail(User);

            expect(user.token).not.toBe(null);
            expect(user.token).not.toBe(undefined);
            expect(user.token_expiry).not.toBe(null);
            expect(user.token_expiry).not.toBe(undefined);

            const event = await connection.manager.findOneOrFail(Event);

            expect(event.user_id).toBe(user.id);
            expect(event.status).toBe("PASS");
            expect(event.name).toBe("Forgot Password");
            expect(event.created_on?.getUTCMilliseconds()).toBeLessThanOrEqual(
                new Date().getUTCMilliseconds() - 10
            );
        });
    });
});

describe("auth check", () => {
    beforeAll(async () => {
        baseWorld = new BaseWorld(await DBConnection.get());
        await Helpers.Api.setup(baseWorld, "@setup_auth_check");
    });
    afterAll(async () => {
        await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
        baseWorld.resetProps();
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

describe("Login", () => {
    const userAttr = userAttributes();

    beforeAll(async () => {
        baseWorld = new BaseWorld(await DBConnection.get());
    });

    test("invalid email", async () => {
        await apiRequest(baseWorld, "login", {
            cookie: { withCookie: false, saveCookie: true },
            body: {
                email: "invalid",
                password: userAttr.password,
            },
            errorOnFail: false,
        });
        Request.failed.call(baseWorld);
    });

    describe("Requires database setup and teardown", () => {
        beforeEach(async () => {
            await Helpers.Api.setup(baseWorld, "@setup_login");
        });

        afterEach(async () => {
            await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
            baseWorld.resetProps();
        });

        describe("Valid user and member of a business", () => {
            test("I have an invalid password", async () => {
                await apiRequest(baseWorld, "login", {
                    cookie: { withCookie: false, saveCookie: true },
                    body: {
                        email: userAttr.email,
                        password: "wrongpassword",
                    },
                    errorOnFail: false,
                });
                Request.failed.call(baseWorld);
            });

            test("Valid login", async () => {
                apiRequest(baseWorld, "login", {
                    cookie: {
                        withCookie: false,
                        saveCookie: true,
                    },
                    errorOnFail: false,
                });
                Request.succeeded.call(baseWorld);
            });
        });

        describe("Valid user, but not a member of any businesses", () => {
            beforeEach(async () => {
                // login as user with permissions to invite user
                await login.call(login, baseWorld);
                // create new user and send invitation
                await inviteMember.call(inviteMember, baseWorld, "new");

                // hash plaintext password
                const { email, password } = attributes.login() as {
                    email: string;
                    password: string;
                };

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
                const { password } = attributes.login() as {
                    email: string;
                    password: string;
                };

                await apiRequest(baseWorld, "login", {
                    cookie: { withCookie: false, saveCookie: true },
                    errorOnFail: false,
                    body: {
                        email: (
                            attributes.inviteMember() as {
                                email: string;
                                phone?: string;
                            }
                        ).email,
                        password,
                    },
                });

                Request.failed.call(baseWorld);
            });
        });
    });
});

describe("Register new business and user", () => {
    beforeAll(async () => {
        baseWorld = new BaseWorld(await DBConnection.get());
        await Helpers.Api.setup(baseWorld, "@setup_register_business");
    });

    test("Invalid email", async () => {
        await apiRequest(baseWorld, "registerBusiness", {
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
        await apiRequest(baseWorld, "registerBusiness", {
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

    describe("Business created", () => {
        afterEach(async () => {
            await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
        });

        test("Valid inputs", async () => {
            await registerBusiness.call(registerBusiness, baseWorld);
            Request.succeeded.call(baseWorld);
        });
    });
});

describe("Logout", () => {
    beforeAll(async () => {
        baseWorld = new BaseWorld(await DBConnection.get());
        await Helpers.Api.setup(baseWorld, "@setup_logout");
    });
    afterAll(async () => {
        await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
        baseWorld.resetProps();
    });
    test("Logout authenticated user", async () => {
        await logout.call(logout, baseWorld);

        const cookies = baseWorld.getCustomProp<string>("cookies");
        const expiredCookie = /Expires=Thu, 01 Jan 1970 00:00:00 GMT$/;
        expect(expiredCookie.test(cookies)).toBe(true);
    });
});

describe("Reset password", () => {
    let token: string;

    beforeAll(async () => {
        baseWorld = new BaseWorld(await DBConnection.get());
        await Helpers.Api.setup(baseWorld, "@setup_reset_password");
    });

    afterAll(async () => {
        await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
        baseWorld.resetProps();
    });

    beforeEach(async () => {
        const { email } = userAttributes();
        await forgotPassword.call(forgotPassword, baseWorld, email);

        token =
            (
                await baseWorld
                    .getConnection()
                    .manager.findOneOrFail(User, { where: { email } })
            ).token ?? "";
    });

    test("Valid reset", async () => {
        await resetPassword.call(resetPassword, baseWorld, token, {
            password: "password",
            confirm_password: "password",
        });
        Request.succeeded.call(baseWorld);
    });

    test("Passwords do not match", async () => {
        await resetPassword.call(resetPassword, baseWorld, token, {
            password: "password",
            confirm_password: "invalid_password",
        });
        Request.failed.call(baseWorld, {
            include404: false,
            status: /^400$/,
            message: /^passwords do not match$/i,
        });
    });
});
