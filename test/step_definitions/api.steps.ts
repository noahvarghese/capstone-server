import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "chai";
import BaseWorld from "../support/base_world";
import { client, server } from "../util/permalink";

Given("the user has chosen an environment", function (this: BaseWorld) {
    return;
});

When("the user navigates to the backend", async function (this: BaseWorld) {
    const driver = this.getDriver();
    await driver.get(server);
});

Then(
    "they should be redirected to the frontend",
    async function (this: BaseWorld) {
        const currentUrl = await this.getDriver().getCurrentUrl();
        expect(currentUrl).to.equal(client);
    }
);
