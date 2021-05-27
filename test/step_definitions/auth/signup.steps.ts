import { Given, Then, When } from "@cucumber/cucumber";
import BaseWorld from "../../support/base_world";

Given(
    "an administrator is performing this action",
    async function (this: BaseWorld) {
        return "pending";
    }
);

Given(
    "a non administrator is performing this action",
    async function (this: BaseWorld) {
        return "pending";
    }
);

When("they go to register a new user", async function (this: BaseWorld) {
    return "pending";
});

Then("the users should remain the same", async function (this: BaseWorld) {
    return "pending";
});
