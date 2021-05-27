import { Given, Then, When } from "@cucumber/cucumber";
import User from "../../../src/models/user/user";
import { server } from "../../../src/util/permalink";
import { userAttributes } from "../../sample_data.ts/attributes";
import DBConnection from "../../util/db_connection";
import fetch from "node-fetch";
import FormData from "form-data";
import BaseWorld from "../../support/base_world";
import { expect } from "chai";

const newPassword = "secret";

Given(
    "the user has requested to reset their password",
    async function (this: BaseWorld) {
        // Create user in db
        const user = (await DBConnection.GetConnection()).manager.create(
            User,
            userAttributes
        );

        const body = new FormData();
        body.append("email", user.email);

        // Send post request to /auth/requestPasswordReset with email
        await fetch(server + "auth/requestResetPassword", {
            method: "POST",
            body,
        });

        this.setCustomProp("user", user);
    }
);

When(
    "the user requests to reset their password",
    async function (this: BaseWorld) {
        // Create user in db
        const user = (await DBConnection.GetConnection()).manager.create(
            User,
            userAttributes
        );

        const body = new FormData();
        body.append("email", user.email);

        // Send post request to /auth/requestPasswordReset with email
        await fetch(server + "auth/requestResetPassword", {
            method: "POST",
            body,
        });

        this.setCustomProp("user", user);
    }
);

When("they go to reset their password", async function (this: BaseWorld) {
    let user = this.getCustomProp<User>("user");

    user = (
        await (await DBConnection.GetConnection()).manager.find(User, user)
    )[0];

    const { token } = user;

    // With password, confirmPassword as params
    const body = new FormData();
    body.append("password", newPassword);
    body.append("confirmPassword", newPassword);

    // Send post request to /auth/resetPassword
    await fetch(server + `auth/resetPassword/${token}`, {
        method: "POST",
        body,
    });
    this.setCustomProp("user", user);
});

Then("a token is created", async function (this: BaseWorld) {
    const user = this.getCustomProp<User>("user");
    // Check a token exists for the user
    expect(user.token).to.not.be.null;

    // And the expiry date is correct
    // We should test the specific time it sets
    expect(user.token_expiry).to.not.be.null;
    expect(user.token_expiry?.getUTCMilliseconds()).to.be.greaterThan(
        new Date().getUTCMilliseconds()
    );
});

Then("they are sent a token", async function () {
    // Check that an email was sent (This requires logging of events in the database)
    // Maybe try login to email to confirm email was sent
    return "pending";
});

Then("the password is reset", async function (this: BaseWorld) {
    const user = this.getCustomProp<User>("user");
    expect(await user.comparePassword(newPassword)).to.be.true;
});

Then("the password is not reset", async function (this: BaseWorld) {
    const user = this.getCustomProp<User>("user");
    expect(await user.comparePassword(newPassword)).to.be.false;
});
