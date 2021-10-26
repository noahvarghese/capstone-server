import { Then, When } from "@cucumber/cucumber";
import BaseWorld from "../../support/base_world";
import { expect } from "chai";
import actions from "__test__/helpers/api/actions/auth";

When("I log out", actions.logout);

Then("the cookie is destroyed", function (this: BaseWorld) {
    const cookies = this.getCustomProp<string>("cookies");
    const expiredCookie = /Expires=Thu, 01 Jan 1970 00:00:00 GMT$/;
    expect(expiredCookie.test(cookies)).to.be.true;
});
