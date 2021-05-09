import { When, Then } from "@cucumber/cucumber";
import { expect } from "chai";
import BaseWorld from "../support/base_world";
import { server } from "../../src/util/permalink";
import { getResponseStatus } from "../util/request";
import Logs from "../../src/util/logs/logs";

When(
    "a user has navigated to the root of the backend",
    async function (this: BaseWorld) {
        Logs.Error(server);
        const status = await getResponseStatus(server);
        this.setCustomProp<number>("status", status);
    }
);

Then("they should be redirected to the frontend", function (this: BaseWorld) {
    const status = this.getCustomProp<number>("status");
    expect(status.toString()[0]).to.be.equal("3");
    expect(status.toString().length).to.equal(3);
});
