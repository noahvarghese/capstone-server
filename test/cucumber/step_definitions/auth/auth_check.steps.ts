import { Given, Then, When } from "@cucumber/cucumber";
import { server } from "../../../../src/util/permalink";
import axios from "axios";
import BaseWorld from "../../support/base_world";
import { userAttributes } from "../../../sample_data/attributes";
import { expect } from "chai";
import { getCookie } from "../../../util/request";

Given("the user has been authenticated", async function (this: BaseWorld) {
    const { email, password } = userAttributes;

    const response = await axios.post(
        server("/auth/login"),
        { email, password },
        { withCredentials: true }
    );

    this.setCustomProp<string>("cookies", getCookie(response.headers));
});

Given("the user has not been authenticated", async function (this: BaseWorld) {
    this.setCustomProp<string>("cookies", "");
    return;
});

When(
    "the user checks if they are authenticated",
    async function (this: BaseWorld) {
        const cookies = this.getCustomProp<string>("cookies");

        let status: number;

        try {
            const response = await axios.post(server("/auth"), undefined, {
                headers: { Cookie: cookies },
                withCredentials: true,
            });

            status = response.status;
        } catch (err) {
            status = err.response.status;
        }

        this.setCustomProp<number>("response_status", status);
    }
);

Then("a confirmation is returned", async function (this: BaseWorld) {
    const status = this.getCustomProp<number>("response_status");

    expect(status).to.be.equal(200);
});

Then("an error is returned", async function (this: BaseWorld) {
    const status = this.getCustomProp<number>("response_status");

    expect(status).to.be.equal(400);
});
