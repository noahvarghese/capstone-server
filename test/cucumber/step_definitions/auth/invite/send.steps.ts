import { Given, When, Then } from "@cucumber/cucumber";
import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";
import { InviteUserProps } from "@routes/member/invite";
import actions from "@test/cucumber/helpers/actions/auth";
import attributes from "@test/sample_data/api/attributes";
import BaseWorld from "@test/cucumber/support/base_world";
import { expect } from "chai";
import Event from "@models/event";

Given("I am logged in as an admin", actions.login);

When(/an? (new|existing) user is added to the business/, actions.inviteUser);

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
