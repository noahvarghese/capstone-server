import { When, Then } from "@cucumber/cucumber";
import { expect } from "chai";
import BaseWorld from "../support/base_world";
import { client, server } from "../../../src/util/permalink";
import { getRedirectInfo } from "../../util/request";
import Logs from "../../../src/util/logs/logs";

When(
    "a user has navigated to the root of the backend",
    async function (this: BaseWorld) {
        Logs.Error(server());
        const response = await getRedirectInfo(server());
        this.setCustomProp<number>("status", response.status);
        this.setCustomProp<string>("location", response.location);
    }
);

Then("they should be redirected to the frontend", function (this: BaseWorld) {
    const status = this.getCustomProp<number>("status");
    const location = this.getCustomProp<string>("location");
    expect(location).to.contain(client());
    expect(status).to.be.equal(302);
});
