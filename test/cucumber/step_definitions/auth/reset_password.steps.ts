import { Given, Then, When } from "@cucumber/cucumber";
import User from "../../../../src/models/user/user";
import { server } from "../../../../src/util/permalink";
import { userAttributes } from "../../../sample_data/attributes";
import DBConnection from "../../../util/db_connection";
import Event from "../../../../src/models/event";
import FormData from "form-data";
import BaseWorld from "../../support/base_world";
import { expect } from "chai";
import { Connection } from "typeorm";
import axios from "axios";

const newPassword = "secret123";

Given("the user is registered", function (this: BaseWorld) {
    this.setCustomProp<{ email: string }>("credentials", {
        email: userAttributes.email,
    });
});

Given(
    "the user has requested to reset their password",
    async function (this: BaseWorld) {
        await axios.post(server("auth/requestResetPassword"), {
            email: userAttributes.email,
        });

        const connection = this.getCustomProp<Connection>("connection");

        this.setCustomProp<User>(
            "user",
            (
                await connection.manager.find(User, {
                    where: { email: userAttributes.email },
                })
            )[0]
        );
    }
);

Given("they have an invalid token", function (this: BaseWorld) {
    this.setCustomProp<string>("invalid_token", "invalid_token");
});

Given("the passwords do not match", function (this: BaseWorld) {
    this.setCustomProp<string>("invalid_password", "invalid_password");
});

When(
    "the user requests to reset their password",
    async function (this: BaseWorld) {
        const { email } = this.getCustomProp<{ email: string }>("credentials");

        let message = "";

        try {
            // Send post request to /auth/requestPasswordReset with email
            const res = await axios.post(server("auth/requestResetPassword"), {
                email,
            });
            message = res.data.message;
        } catch (err) {
            fail("Reset password request failed");
        }

        this.setCustomProp<string>("message", message);

        const connection = this.getCustomProp<Connection>("connection");

        this.setCustomProp<User>(
            "user",
            (await connection.manager.find(User, { where: { email } }))[0]
        );
    }
);

When(
    "they go to reset their password",
    { timeout: 10000 },
    async function (this: BaseWorld) {
        let user = this.getCustomProp<User>("user");

        user = (
            await (
                await DBConnection.GetConnection()
            ).manager.find(User, { where: { email: userAttributes.email } })
        )[0];

        const { token } = user;
        const invalid_token = this.getCustomProp<string>("invalid_token");
        const invalid_password = this.getCustomProp<string>("invalid_password");

        // With password, confirmPassword as params
        const body = new FormData();
        body.append("password", newPassword);
        body.append("confirm_password", invalid_password ?? newPassword);

        // checks if an invalid token was provided for the test
        try {
            await axios.post(
                server(`auth/resetPassword/${invalid_token ?? token}`),
                body,
                { headers: body.getHeaders() }
            );
        } catch (_) {
            // We don't care about an error here
            // as axios throws an error for any non 200 code
        }

        const connection = this.getCustomProp<Connection>("connection");

        user = (
            await connection.manager.find(User, {
                where: { email: userAttributes.email },
            })
        )[0];

        this.setCustomProp<User>("user", user);
    }
);

Then("a token should be created", async function (this: BaseWorld) {
    const user = this.getCustomProp<User>("user");
    expect(user.token).to.not.be.null;

    // And the expiry date is correct
    // We should test the specific time it sets
    expect(user.token_expiry).to.not.be.null;
    expect(user.token_expiry).to.be.greaterThan(new Date());
});

Then("they are sent a token", async function (this: BaseWorld) {
    // Check that an email was sent (This requires logging of events in the database)
    // Maybe try login to email to confirm email was sent
    const user = this.getCustomProp<User>("user");
    const connection = this.getCustomProp<Connection>("connection");

    try {
        const event = (
            await connection.manager.find(Event, {
                where: { user_id: user.id },
                order: { created_on: "DESC" },
            })
        )[0];

        expect(event.created_on).to.not.be.null;

        expect(event.created_on?.getUTCMilliseconds()).to.be.lessThan(
            new Date().getUTCMilliseconds() - 10
        );
    } catch (_) {
        expect.fail();
    }
});

Then("the password is reset", async function (this: BaseWorld) {
    const user = this.getCustomProp<User>("user");
    expect(await user.comparePassword(newPassword)).to.be.true;
});

Then("the token is cleared", async function (this: BaseWorld) {
    let user = this.getCustomProp<User>("user");
    const connection = this.getCustomProp<Connection>("connection");
    user = await connection.manager.findOneOrFail(User, user.id);
    expect(user.token).to.be.null;
});

Then("the token expiry is cleared", async function (this: BaseWorld) {
    const user = this.getCustomProp<User>("user");
    expect(user.token_expiry).to.be.null;
});

Then("the password is not reset", async function (this: BaseWorld) {
    const user = this.getCustomProp<User>("user");
    expect(await user.comparePassword(newPassword)).to.be.false;
});
