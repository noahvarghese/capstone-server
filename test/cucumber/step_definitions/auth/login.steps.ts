import { Given, Then, When } from "@cucumber/cucumber";
import User from "../../../../src/models/user/user";
import { server } from "../../../../src/util/permalink";
import BaseWorld from "../../support/base_world";
import { userAttributes } from "../../../sample_data.ts/attributes";
import { expect } from "chai";
import fetch from "node-fetch";
import FormData from "form-data";

Given("the user has valid credentials", async function (this: BaseWorld) {
    this.setCustomProp<{ email: string; password: string }>("credentials", {
        email: userAttributes.email,
        password: userAttributes.password,
    });
});

Given("the user has an invalid email", async function (this: BaseWorld) {
    this.setCustomProp<{ email: string; password: string }>("credentials", {
        email: "invalid",
        password: userAttributes.password,
    });
});

Given("the user has an invalid password", async function (this: BaseWorld) {
    this.setCustomProp<{ email: string; password: string }>("credentials", {
        email: userAttributes.email,
        password: "invalid",
    });
});

When("the user logs in", async function (this: BaseWorld) {
    const { email, password } =
        this.getCustomProp<{ email: string; password: string }>("credentials");

    const body = new FormData();
    body.append("email", email);
    body.append("password", password);

    const res = await fetch(server + "auth/login", {
        method: "POST",
        body,
    });

    const cookies = res.headers.get("set-cookie");
    try {
        this.setCustomProp<string>(
            "message",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((await res.json()) as any).message
        );
    } catch (_) {
        this.setCustomProp<string>("message", "");
    }

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
    const { email } =
        this.getCustomProp<{ email: string; password: string }>("credentials");
    const user = this.getCustomProp<User>("user");
    const status = this.getCustomProp<number>("status");
    const cookies = this.getCustomProp<string | null>("cookies");

    if (user.email !== email) {
        expect(this.getCustomProp<string>("message")).to.be.equal(
            `Invalid login ${email}.`
        );
        expect(status).to.be.equal(400);
    } else {
        expect(status).to.be.equal(401);
    }
    expect(cookies).to.be.equal(null);
});
