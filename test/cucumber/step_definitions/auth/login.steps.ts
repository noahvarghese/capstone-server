import { Given, Then, When } from "@cucumber/cucumber";
import BaseWorld from "../../support/base_world";
import { userAttributes } from "@test/sample_data/model/attributes";
import { expect } from "chai";
import { loadBody } from "@test/cucumber/helpers/setup";
import { submitForm } from "@test/cucumber/helpers/submit_form";
import actions from "@test/helpers/api/actions/auth";
import attributes from "@test/sample_data/api/attributes";
import { InviteUserProps } from "@routes/members/invite";
import { LoginProps } from "@routes/auth/login";
import User from "@models/user/user";
import { urls } from "@test/sample_data/api/dependencies";

const userAttr = userAttributes();

Given("I have valid credentials", function (this: BaseWorld) {
    loadBody.call(this, "login");
});

Given("I have an invalid email", function (this: BaseWorld) {
    this.setCustomProp<{ email: string; password: string }>("body", {
        email: "invalid",
        password: userAttr.password,
    });
});

Given("I have an invalid password", function (this: BaseWorld) {
    this.setCustomProp<{ email: string; password: string }>("body", {
        email: userAttr.email,
        password: "invalid",
    });
});

When("I log in", async function (this: BaseWorld) {
    await submitForm.call(this, urls.login as string, true, false, false);
});

Given("I have been sent an invite", async function (this: BaseWorld) {
    await actions.inviteUser.call(this, "new");

    // set password
    const { email, password } = attributes.login() as LoginProps;

    const connection = this.getConnection();
    const user = await connection.manager.findOneOrFail(User, {
        where: { email },
    });

    await connection.manager.update(
        User,
        { id: user.id },
        { password: (await user.hashPassword(password)).password }
    );

    // set props for login
    this.setCustomProp("body", {
        email: (attributes.inviteUser() as InviteUserProps).email,
        password,
    });
});

Then("I should be authenticated", function (this: BaseWorld) {
    const cookies = this.getCustomProp<string | null>("cookies");
    const status = this.getCustomProp<number>("status");

    expect(status.toString()).to.match(/^20/);
    expect(cookies).to.not.equal(null);
    expect(cookies?.length).to.be.greaterThan(0);
});

Then("I should not be authenticated", function (this: BaseWorld) {
    const status = this.getCustomProp<number>("status");
    const cookies = this.getCustomProp<string | null>("cookies");

    expect(status.toString()).to.match(/^[54]0/);
    expect(cookies).to.be.not.ok;
});
