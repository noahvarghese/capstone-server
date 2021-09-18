import { Then, When } from "@cucumber/cucumber";
import axios from "axios";
import { server } from "../../../../src/util/permalink";
import { getCookie } from "../../../util/request";
import BaseWorld from "../../support/base_world";
import { expect } from "chai";

When("the user logs out", async function (this: BaseWorld) {
    let cookies = this.getCustomProp<string>("cookies");

    let status: number;

    try {
        const response = await axios.post(server("/auth/logout"), undefined, {
            headers: { Cookie: cookies },
            withCredentials: true,
        });
        status = response.status;
        cookies = getCookie(response.headers);
    } catch (err) {
        status = err.response.status;
        cookies = "";
    }

    this.setCustomProp<number>("status", status);
    this.setCustomProp<string>("cookies", cookies);
});

Then("the cookie is destroyed", function (this: BaseWorld) {
    const cookies = this.getCustomProp<string>("cookies");
    const expiredCookie = /Expires=Thu, 01 Jan 1970 00:00:00 GMT$/;
    expect(expiredCookie.test(cookies)).to.be.true;
});
