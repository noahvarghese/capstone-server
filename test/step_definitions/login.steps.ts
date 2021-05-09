import { userAttributes } from "../util/attributes";
import { When, Then, Given } from "@cucumber/cucumber";
import { expect } from "chai";
import { server } from "../../src/util/permalink";
import BaseWorld from "../support/base_world";
import fetch from "node-fetch";
import FormData from "form-data";
import User from "../../src/models/user/user";
import DBConnection from "../util/db_connection";

let user: User;

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
