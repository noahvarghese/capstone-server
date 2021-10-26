import { Given, When } from "@cucumber/cucumber";
import BaseWorld from "../../support/base_world";
import { loadBody } from "@test/cucumber/helpers/setup";
import { submitForm } from "@test/cucumber/helpers/submit_form";
import { urls } from "__test__/sample_data/api/dependencies";

Given("I have valid inputs", function (this: BaseWorld) {
    loadBody.call(this, "registerBusiness");
});

When(
    "I register a new business",
    { timeout: 10000 },
    async function (this: BaseWorld) {
        await submitForm.call(
            this,
            urls.registerBusiness as string,
            true,
            false
        );
    }
);
