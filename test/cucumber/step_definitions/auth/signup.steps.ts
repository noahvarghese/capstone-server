import { Given, When } from "@cucumber/cucumber";
import BaseWorld from "../../support/base_world";
import { loadAttributes } from "@test/cucumber/helpers/setup";
import { submitForm } from "@test/cucumber/helpers/submit_form";

Given("the user has valid inputs", function (this: BaseWorld) {
    loadAttributes.call(this, "registerBusiness");
});

When(
    "a new user registers a new business",
    { timeout: 10000 },
    async function (this: BaseWorld) {
        await submitForm.call(this, "auth/signup", true, false);
    }
);
