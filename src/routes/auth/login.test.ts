import User from "@models/user/user";
import { InviteMemberProps } from "@routes/members/invite";
import { LoginProps } from "./login";
import Helpers from "@test/helpers";
import { apiRequest } from "@test/api/actions";
import Request from "@test/api/helpers/request";
import attributes from "@test/api/attributes";
import { userAttributes } from "@test/model/attributes";
import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import { inviteMember } from "@test/api/actions/members";
import { login } from "@test/api/actions/auth";

let baseWorld: BaseWorld;
const userAttr = userAttributes();

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
    await Helpers.Api.setup(baseWorld, "@setup_login");
});

afterEach(async () => {
    await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
    baseWorld.resetProps();
});

describe("Login with user that has already accepted an invite to a business", () => {
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

describe("Login with user that has not accepted an invite", () => {
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

    test("Valid credentials", async () => {
        const { password } = attributes.login() as LoginProps;

        await apiRequest(baseWorld, "login", {
            cookie: { withCookie: false, saveCookie: true },
            errorOnFail: false,
            body: {
                email: (attributes.inviteMember() as InviteMemberProps).email,
                password,
            },
        });

        Request.failed.call(baseWorld);
    });
});
