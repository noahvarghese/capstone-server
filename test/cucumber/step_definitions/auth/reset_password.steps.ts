import { Given, Then, When } from "@cucumber/cucumber";
import User from "../../../../src/models/user/user";
import { server } from "../../../../src/util/permalink";
import { userAttributes } from "../../../sample_data/attributes";
import DBConnection from "../../../util/db_connection";
import Event from "../../../../src/models/event";
import fetch from "node-fetch";
import FormData from "form-data";
import BaseWorld from "../../support/base_world";
import { expect } from "chai";
import { Connection } from "typeorm";

const newPassword = "secret";

Given("the user is registered", function (this: BaseWorld) {
    this.setCustomProp<{ email: string }>("credentials", {
        email: userAttributes.email,
    });
});

Given(
    "the user has requested to reset their password",
    async function (this: BaseWorld) {
        const body = new FormData();
        body.append("email", userAttributes.email);

        // Send post request to /auth/requestPasswordReset with email
        await fetch(server + "auth/requestResetPassword", {
            method: "POST",
            body,
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

        const body = new FormData();
        body.append("email", email);

        // Send post request to /auth/requestPasswordReset with email
        const res = await fetch(server + "auth/requestResetPassword", {
            method: "POST",
            body,
        });

        try {
            this.setCustomProp<string>(
                "message",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ((await res.json()) as any).message
            );
        } catch (_) {
            this.setCustomProp<string>("message", "");
        }

        const connection = this.getCustomProp<Connection>("connection");

        this.setCustomProp<User>(
            "user",
            (await connection.manager.find(User, { where: { email } }))[0]
        );
    }
);

When("they go to reset their password", async function (this: BaseWorld) {
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
    body.append("confirmPassword", invalid_password ?? newPassword);

    // checks if an invalid token was provided for the test
    await fetch(server + `auth/resetPassword/${invalid_token ?? token}`, {
        method: "POST",
        body,
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
});

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

Then("the password is not reset", async function (this: BaseWorld) {
    const user = this.getCustomProp<User>("user");
    expect(await user.comparePassword(newPassword)).to.be.false;
});
