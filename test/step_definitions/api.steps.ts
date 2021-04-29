import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "chai";
import Logs from "../../src/util/logs/logs";
import BaseWorld from "../support/base_world";
import { client, server } from "../util/permalink";

Given("the user has chosen an environment", function (this: BaseWorld) {
    return;
});

When("the user navigates to the backend", async function (this: BaseWorld) {
    const res = await fetch(server);
    this.setCustomProp("status", res.status);
    Logs.Log(res.status);
});

Then("they should be redirected to the frontend", function (this: BaseWorld) {
    Logs.Log(this.getCustomProp("status"));
});
