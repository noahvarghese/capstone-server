import { userAttributes } from "../util/attributes";
import { When, Then, Given } from "@cucumber/cucumber";
import { expect } from "chai";
import { server } from "../../src/util/permalink";
import BaseWorld from "../support/base_world";
import fetch from "node-fetch";
import FormData from "form-data";
import User from "../../src/models/user/user";
import DBConnection from "../util/db_connection";
import bcrypt from "bcrypt";

let user: User;
const newPassword = "secret";

Given("the user has valid credentials", async function (this: BaseWorld) {
    user = (await DBConnection.GetConnection()).manager.create(
        User,
        userAttributes
    );
});

Given("the user has an invalid email", async function () {
    user = (await DBConnection.GetConnection()).manager.create(User, {
        ...userAttributes,
        email: "invalid",
    });
});

Given("the user has an invalid password", async function () {
    user = (await DBConnection.GetConnection()).manager.create(User, {
        ...userAttributes,
        password: "invalid",
    });
});

Given("the user has requested to reset their password", async function () {
    // Create user in db
    user = (await DBConnection.GetConnection()).manager.create(
        User,
        userAttributes
    );

    const body = new FormData();
    body.append("email", user.email);

    // Send post request to /auth/requestPasswordReset with email
    await fetch(server + "auth/requestResetPassword", { method: "POST", body });
});

When("the user logs in", async function (this: BaseWorld) {
    const body = new FormData();
    body.append("email", user.email);
    body.append("password", user.password);

    const res = await fetch(server + "auth/login", {
        method: "POST",
        body,
    });

    const cookies = res.headers.get("set-cookie");
    this.setCustomProp<string | null>("cookies", cookies);
    this.setCustomProp<number>("status", res.status);
});

When("the user requests to reset their password", async function () {
    // Create user in db
    user = (await DBConnection.GetConnection()).manager.create(
        User,
        userAttributes
    );

    const body = new FormData();
    body.append("email", user.email);

    // Send post request to /auth/requestPasswordReset with email
    await fetch(server + "auth/requestResetPassword", { method: "POST", body });
});

When("they go to reset their password", async function () {
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
});

Then("a cookie should be returned", function (this: BaseWorld) {
    const cookies = this.getCustomProp<string | null>("cookies");
    const status = this.getCustomProp<number>("status");

    expect(status).to.be.equal(202);
    expect(cookies).to.not.equal(null);
    expect(cookies?.length).to.be.greaterThan(0);
});

Then("it should be unsuccessful", function (this: BaseWorld) {
    const status = this.getCustomProp<number>("status");
    const cookies = this.getCustomProp<string | null>("cookies");

    if (user.email !== userAttributes.email) {
        expect(status).to.be.equal(500);
    } else {
        expect(status).to.be.equal(401);
    }
    expect(cookies).to.be.equal(null);
});

Then("a token is created", async function () {
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

Then("the password is reset", async function () {
    expect(await user.comparePassword(newPassword)).to.be.true;
});

Then("the password is not reset", async function () {
    expect(await user.comparePassword(newPassword)).to.be.false;
});
