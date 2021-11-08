import User from "@models/user/user";
import { InviteUserProps } from "@routes/members/invite";
import { LoginProps } from "./login";
import Helpers from "@test/helpers";
import actions, { apiRequest } from "@test/helpers/api/actions";
import Request from "@test/helpers/api/request";
import attributes from "@test/sample_data/api/attributes";
import { userAttributes } from "@test/sample_data/model/attributes";
import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";

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
    await Helpers.Api.setup.call(baseWorld, "@setup_login");
});

afterEach(async () => {
    await Helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
    baseWorld.resetProps();
});

describe("Login with user that has already accepted an invite to a business", () => {
    test("invalid email", async () => {
        await apiRequest.call(baseWorld, "login", {
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
        await apiRequest.call(baseWorld, "login", {
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
        apiRequest.call(baseWorld, "login", {
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
        await actions.login.call(baseWorld);
        // create new user and send invitation
        await actions.inviteUser.call(baseWorld, "new");

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

        await apiRequest.call(baseWorld, "login", {
            cookie: { withCookie: false, saveCookie: true },
            errorOnFail: false,
            body: {
                email: (attributes.inviteUser() as InviteUserProps).email,
                password,
            },
        });

        Request.failed.call(baseWorld);
    });
});
