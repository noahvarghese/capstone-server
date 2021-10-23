import { Then, When } from "@cucumber/cucumber";
import Role from "@models/role";
import actions from "@test/helpers/api/actions/auth";
import BaseWorld from "@test/cucumber/support/base_world";
import { MoreThan } from "typeorm";
import { expect } from "chai";

When("I create a role", actions.createRole);

Then("a new role exists", async function (this: BaseWorld) {
    const res = await this.getConnection().manager.findOneOrFail(Role, {
        where: { created_on: MoreThan(new Date().getTime() - 10000) },
    });

    expect(res).to.exist;
});
