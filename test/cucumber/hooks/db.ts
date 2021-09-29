import { After, Before } from "@cucumber/cucumber";
import { Connection } from "typeorm";
import DBConnection from "../../util/db_connection";
import BaseWorld from "../support/base_world";
import { RegisterProps } from "../../../src/routes/auth/signup";
import { cleanupByUserAndBusiness } from "../../jest/helpers/model/test/teardown";

Before("@db", async function (this: BaseWorld) {
    this.setCustomProp<Connection>(
        "connection",
        await DBConnection.GetConnection()
    );
});

After("@db", async function (this: BaseWorld) {
    this.setCustomProp<undefined>("connection", undefined);
});

// cleanup
After({ tags: "@signup_business" }, async function (this: BaseWorld) {
    await cleanupByUserAndBusiness<RegisterProps>(this, "details", "userRole");
});
