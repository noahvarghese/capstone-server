import { Given, Then, When } from "@cucumber/cucumber";
import User from "../../../../src/models/user/user";
import { server } from "../../../../src/util/permalink";
import BaseWorld from "../../support/base_world";
import { userAttributes } from "../../../sample_data/model_attributes";
import { expect } from "chai";
import axios from "axios";
import { getCookie } from "../../../util/request";

const userAttr = userAttributes();
Given("the user has valid credentials", function (this: BaseWorld) {
    this.setCustomProp<{ email: string; password: string }>("credentials", {
        email: userAttr.email,
        password: userAttr.password,
    });
});

Given("the user has an invalid email", function (this: BaseWorld) {
    this.setCustomProp<{ email: string; password: string }>("credentials", {
        email: "invalid",
        password: userAttr.password,
    });
});

Given("the user has an invalid password", function (this: BaseWorld) {
    this.setCustomProp<{ email: string; password: string }>("credentials", {
        email: userAttr.email,
        password: "invalid",
    });
});

When("the user logs in", async function (this: BaseWorld) {
    const { email, password } =
        this.getCustomProp<{ email: string; password: string }>("credentials");

    let cookie = "";
    let status: number;
    let message = "";

    try {
        const res = await axios.post(
            server("auth/login"),
            { email, password },
            {
                withCredentials: true,
            }
        );
        cookie = getCookie(res.headers);
        message = res.data.message;
        status = res.status;
    } catch (err) {
        const { response } = err;
        status = response.status;
        message = response.data.message;
    }

    this.setCustomProp<string>("message", message);
    this.setCustomProp<string | null>("cookies", cookie);
    this.setCustomProp<number>("status", status);
});

Then("a cookie should be returned", function (this: BaseWorld) {
    const cookies = this.getCustomProp<string | null>("cookies");
    const status = this.getCustomProp<number>("status");

    expect(status.toString()).to.match(/^20/);
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
    expect(cookies).to.be.not.ok;
});
