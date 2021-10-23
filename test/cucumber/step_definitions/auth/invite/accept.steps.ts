import { Given, Then, When } from "@cucumber/cucumber";
import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";
import actions from "@test/helpers/api/actions/auth";
import attributes from "@test/sample_data/api/attributes";
import BaseWorld from "@test/cucumber/support/base_world";
import Membership from "@models/membership";
import { InviteUserProps } from "@routes/members/invite";
import { expect } from "chai";

Given("the user has received an invite", async function (this: BaseWorld) {
    const connection = this.getConnection();

    const user = await connection.manager.findOneOrFail(User, {
        where: { email: (attributes.inviteUser() as InviteUserProps).email },
    });

    try {
        await connection.manager.findOneOrFail(MembershipRequest, {
            where: { user_id: user.id },
        });
    } catch (e) {
        console.log(e);
        await actions.inviteUser.call(this, "new");
    }
});

When("the user accepts the invite", actions.acceptInvite);

Then("the user is a member of the business", async function (this: BaseWorld) {
    const connection = this.getConnection();

    const { email } = attributes.inviteUser() as InviteUserProps;

    const user = await connection.manager.findOneOrFail(User, {
        where: { email },
    });

    const membership = await connection.manager.findOneOrFail(Membership, {
        where: { user_id: user.id },
    });

    expect(membership).to.exist;
});
