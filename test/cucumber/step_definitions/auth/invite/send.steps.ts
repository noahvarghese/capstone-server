import { Given, When, Then } from "@cucumber/cucumber";
import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";
import { InviteUserProps } from "@routes/members/invite";
import actions from "@test/helpers/api/actions/auth";
import attributes from "@test/sample_data/api/attributes";
import BaseWorld from "@test/cucumber/support/base_world";
import { expect } from "chai";
import Event from "@models/event";
import loadAndCall from "@test/helpers/api/actions";
import Business from "@models/business";
import Membership from "@models/membership";

Given("I am logged in as an admin", actions.login);
Given("I am logged in as a user", async function (this: BaseWorld) {
    const email = "automailr.noreply@gmail.com";
    const { password } = attributes.login();
    const { first_name, last_name } = attributes.inviteUser();

    const connection = this.getConnection();
    const user = await new User({ email, first_name, last_name }).hashPassword(
        password
    );

    const res = await connection.manager.insert(User, user);

    const business = await connection
        .createQueryBuilder()
        .select("b")
        .from(Business, "b")
        .where("b.name = :name", {
            name: this.getCustomProp<string[]>("businessNames")[0],
        })
        .getOne();

    await connection.manager.insert(
        Membership,
        new Membership({
            business_id: business?.id,
            user_id: res.identifiers[0].id,
            default: true,
        })
    );

    // create new user in database with relationships
    //login

    await loadAndCall.call(
        this,
        "login",
        {
            withCookie: false,
            saveCookie: true,
        },
        undefined,
        { email, password }
    );
});

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

Then("I get an error", async function (this: BaseWorld) {
    expect(this.getCustomProp<number>("status")).to.be.greaterThan(299);
    expect(this.getCustomProp<number>("status")).not.to.be.eq(404);
});
