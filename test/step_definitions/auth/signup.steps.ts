import { Given, Then, When } from "@cucumber/cucumber";
import Role from "../../../src/models/role";
import User from "../../../src/models/user/user";
import {
    roleAttributes,
    userAttributes,
} from "../../sample_data.ts/attributes";
import BaseWorld from "../../support/base_world";
import DBConnection from "../../util/db_connection";

Given(
    "an administrator is performing this action",
    async function (this: BaseWorld) {
        const admin = (await DBConnection.GetConnection()).manager.create(
            User,
            userAttributes
        );

        const adminRole = (await DBConnection.GetConnection()).manager.create(
            Role,
            roleAttributes
        );
        return "pending";
    }
);

Given(
    "a non administrator is performing this action",
    async function (this: BaseWorld) {
        return "pending";
    }
);

When("they go to register a new user", async function (this: BaseWorld) {
    return "pending";
});

Then("the users should remain the same", async function (this: BaseWorld) {
    return "pending";
});

Then(
    "the new user should have been sent a registration confirmation",
    async function (this: BaseWorld) {
        return "pending";
    }
);
