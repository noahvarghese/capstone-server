import User from "@models/user/user";
import { InviteUserProps } from "@routes/members/invite";
import { requestFailed, requestSucceeded } from "@test/helpers/api/request";
import { loadBody, setup } from "@test/helpers/api/setup";
import { submitForm } from "@test/helpers/api/submit_form";
import { teardown } from "@test/helpers/api/teardown";
import AppServer from "@test/helpers/server";
import attributes from "@test/sample_data/api/attributes";
import { urls } from "@test/sample_data/api/dependencies";
import { userAttributes } from "@test/sample_data/model/attributes";
import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/util/db_connection";
import { LoginProps } from "./login";
import actions from "@test/helpers/api/actions/auth";

let baseWorld: BaseWorld;
const userAttr = userAttributes();

describe("Login", () => {
    beforeEach(async () => {
        await AppServer.start();
        await DBConnection.InitConnection();
        console.log(DBConnection);
        baseWorld = new BaseWorld(await DBConnection.GetConnection());
        baseWorld.setCustomProp<string[]>("businessNames", [
            "Oakville Windows and Doors",
        ]);
        setup.call(baseWorld, "@setup_login");
    });

    afterEach(async () => {
        await teardown.call(baseWorld, "@cleanup_user_role");
        await baseWorld.clearConnection();
        await AppServer.stop();
    });

    test("invalid email", async () => {
        baseWorld.setCustomProp<{ email: string; password: string }>("body", {
            email: "invalid",
            password: userAttr.password,
        });
        await submitForm.call(
            baseWorld,
            urls.login as string,
            true,
            false,
            false
        );
        requestFailed.call(baseWorld);
    });

    test("I have an invalid password", async () => {
        baseWorld.setCustomProp<{ email: string; password: string }>("body", {
            email: userAttr.email,
            password: "invalid",
        });
        await submitForm.call(
            baseWorld,
            urls.login as string,
            true,
            false,
            false
        );
        requestFailed.call(baseWorld);
    });

    test("Valid login", async () => {
        loadBody.call(baseWorld, "login");
        await submitForm.call(
            baseWorld,
            urls.login as string,
            true,
            false,
            false
        );
        requestSucceeded.call(baseWorld);
    });

    test("Haven't accepted invite", async () => {
        await actions.login.call(baseWorld);
        await actions.inviteUser.call(baseWorld, "new");

        // set password
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

        // set props for login
        baseWorld.setCustomProp("body", {
            email: (attributes.inviteUser() as InviteUserProps).email,
            password,
        });
    });
});
