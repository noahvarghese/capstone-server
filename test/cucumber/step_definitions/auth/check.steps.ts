import { Given, Then, When } from "@cucumber/cucumber";
import BaseWorld from "../../support/base_world";
import { expect } from "chai";
import actions from "__test__/helpers/api/actions/auth";

Given("I have been authenticated", actions.login);

Given("I have not been authenticated", async function (this: BaseWorld) {
    this.setCustomProp<string>("cookies", "");
    return;
});

When("I check if I am authenticated", actions.authCheck);

Then("a confirmation is returned", async function (this: BaseWorld) {
    const status = this.getCustomProp<number | null>("status");
    expect(status).to.be.equal(200);
});

Then("an error is returned", async function (this: BaseWorld) {
    const status = this.getCustomProp<number | null>("status");
    expect(status).to.be.equal(400);
});
