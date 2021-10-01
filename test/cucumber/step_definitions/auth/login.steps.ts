import { Given, Then, When } from "@cucumber/cucumber";
import BaseWorld from "../../support/base_world";
import { userAttributes } from "@test/sample_data/model/attributes";
import { expect } from "chai";
import { loadBody } from "@test/cucumber/helpers/setup";
import { submitForm } from "@test/cucumber/helpers/submit_form";

const userAttr = userAttributes();

Given("the user has valid credentials", function (this: BaseWorld) {
    loadBody.call(this, "login");
});

Given("the user has an invalid email", function (this: BaseWorld) {
    this.setCustomProp<{ email: string; password: string }>("body", {
        email: "invalid",
        password: userAttr.password,
    });
});

Given("the user has an invalid password", function (this: BaseWorld) {
    this.setCustomProp<{ email: string; password: string }>("body", {
        email: userAttr.email,
        password: "invalid",
    });
});

When("the user logs in", async function (this: BaseWorld) {
    await submitForm.call(this, "auth/login", true, false);
});

Then("the user should be authenticated", function (this: BaseWorld) {
    const cookies = this.getCustomProp<string | null>("cookies");
    const status = this.getCustomProp<number>("status");

    expect(status.toString()).to.match(/^20/);
    expect(cookies).to.not.equal(null);
    expect(cookies?.length).to.be.greaterThan(0);
});

Then("the user should not be authenticated", function (this: BaseWorld) {
    const status = this.getCustomProp<number>("status");
    const cookies = this.getCustomProp<string | null>("cookies");

    expect(status.toString()).to.match(/^[54]0/);
    expect(cookies).to.be.not.ok;
});
