import { Given, When, Then } from "@cucumber/cucumber";
import User from "@models/user/user";
import BaseWorld from "@test/cucumber/support/base_world";
import Event from "@models/event";
import { expect } from "chai";
import attributes, {
    ForgotPasswordProps,
} from "@test/sample_data/api/attributes";
import { loadBody } from "@test/cucumber/helpers/setup";
import { submitForm } from "@test/cucumber/helpers/submit_form";
import { urls } from "@test/sample_data/api/dependencies";

Given("I am registered", function (this: BaseWorld) {
    loadBody.call(this, "forgotPassword");
});

When("I request to reset the password", async function (this: BaseWorld) {
    await submitForm.call(this, urls.forgotPassword as string, true, false);
});

Then("a token should be created", async function (this: BaseWorld) {
    const connection = this.getConnection();
    const user = (
        await connection.manager.find(User, {
            where: {
                email: (attributes.forgotPassword() as ForgotPasswordProps)
                    .email,
            },
        })
    )[0];

    expect(user.token).to.not.be.null;

    // And the expiry date is correct
    // We should test the specific time it sets
    expect(user.token_expiry).to.not.be.null;
    expect(user.token_expiry).to.be.greaterThan(new Date());
});

Then("I am sent a token", async function (this: BaseWorld) {
    // Check that an email was sent (This requires logging of events in the database)
    // Maybe try login to email to confirm email was sent
    const connection = this.getConnection();
    const user = (
        await connection.manager.find(User, {
            where: {
                email: (attributes.forgotPassword() as ForgotPasswordProps)
                    .email,
            },
        })
    )[0];

    const event = (
        await connection.manager.find(Event, {
            where: { user_id: user.id, name: "Request Reset Password" },
            order: { created_on: "DESC" },
        })
    )[0];

    expect(event).to.exist;

    expect(event.created_on).to.not.be.null;

    expect(event.created_on?.getUTCMilliseconds()).to.be.lessThan(
        new Date().getUTCMilliseconds() - 10
    );
});
