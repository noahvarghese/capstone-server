import { Given, Then } from "@cucumber/cucumber";
import { expect } from "chai";
import BaseWorld from "../support/base_world";
import { server } from "../util/permalink";
import { getResponseStatus } from "../util/request";

Given(
    "the user has navigated to the root of the backend",
    async function (this: BaseWorld) {
        const status = await getResponseStatus(server);
        this.setCustomProp<number>("status", status);
    }
);

Then("they should be redirected to the frontend", function (this: BaseWorld) {
    const status = this.getCustomProp<number>("status");
    expect(status.toString()[0]).to.be.equal("3");
    expect(status.toString().length).to.equal(3);
});
