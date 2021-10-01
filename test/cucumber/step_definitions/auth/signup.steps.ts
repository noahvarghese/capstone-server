import { Given, Then, When } from "@cucumber/cucumber";
import BaseWorld from "../../support/base_world";
import { loadBody } from "@test/cucumber/helpers/setup";
import { submitForm } from "@test/cucumber/helpers/submit_form";
import { urls } from "@test/sample_data/api/dependencies";
import User from "@models/user/user";
import attributes from "@test/sample_data/api/attributes";
import Event from "@models/event";
import MembershipRequest from "@models/membership_request";
import { InviteUserProps } from "@routes/user/invite";
import { expect } from "chai";

Given("the user has valid inputs", function (this: BaseWorld) {
    loadBody.call(this, "registerBusiness");
});

When(
    "a new user registers a new business",
    { timeout: 10000 },
    async function (this: BaseWorld) {
        await submitForm.call(this, "auth/signup", true, false);
    }
);

Given("the user is logged in as an admin", async function (this: BaseWorld) {
    await submitForm.call(this, urls.login, true, false);
});

Given("the user has received an invite", async function (this: BaseWorld) {
    return "pending";
});

When("a new user is added to the business", async function (this: BaseWorld) {
    loadBody.call(this, "inviteUser");
    await submitForm.call(this, urls.inviteUser, true, true, true);
});

Then("the user should get an invite", async function (this: BaseWorld) {
    const connection = this.getConnection();
    const { email } = attributes.inviteUser() as InviteUserProps;

    const user = await connection.manager.find(User, {
        where: {
            email,
        },
    });

    if (user.length !== 1) {
        throw new Error(
            `${
                user.length === 0 ? "No" : "Multiple"
            } users found with email: ${email}`
        );
    }

    const event = await connection.manager.find(Event, {
        where: { user_id: user[0].id },
    });

    if (event.length !== 1) {
        throw new Error(
            `${
                event.length === 0 ? "No" : "Multiple"
            } events found for user: ${email}`
        );
    }

    expect(event[0].status).to.be.equal("PASS");

    const membershipRequests = await connection.manager.find(
        MembershipRequest,
        { where: { user_id: user[0].id } }
    );

    expect(membershipRequests.length).to.be.equal(1);
});
