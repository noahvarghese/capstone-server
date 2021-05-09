import { userAttributes } from "../util/attributes";
import { When, Then } from "@cucumber/cucumber";
import { expect } from "chai";
import { server } from "../../src/util/permalink";
import BaseWorld from "../support/base_world";
import fetch from "node-fetch";
import FormData from "form-data";

When("a user logs in", async function (this: BaseWorld) {
    const body = new FormData();
    body.append("email", userAttributes.email);
    body.append("password", userAttributes.password);

    const res = await fetch(server + "auth/login", {
        method: "POST",
        body,
    });

    const cookies = res.headers.get("set-cookie");
    this.setCustomProp<string | null>("cookies", cookies);
});

Then("a cookie should be returned", function (this: BaseWorld) {
    const cookies = this.getCustomProp<string | null>("cookies");

    expect(cookies).to.not.equal(null);
    expect(cookies?.length).to.be.greaterThan(0);
});
