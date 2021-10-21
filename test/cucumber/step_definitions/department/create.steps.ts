import { Then, When } from "@cucumber/cucumber";
import Department from "@models/department";
import actions from "@test/cucumber/helpers/actions/auth";
import BaseWorld from "@test/cucumber/support/base_world";
import { MoreThan } from "typeorm";
import { expect } from "chai";

When("I create a department", actions.createRole);

Then("a new department exists", async function (this: BaseWorld) {
    const res = await this.getConnection().manager.findOneOrFail(Department, {
        where: { created_on: MoreThan(new Date().getTime() - 10000) },
    });

    expect(res).to.exist;
});
