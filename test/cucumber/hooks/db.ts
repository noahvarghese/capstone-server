import { After, Before } from "@cucumber/cucumber";
import { Connection } from "typeorm";
import DBConnection from "../../util/db_connection";
import BaseWorld from "../support/base_world";
import { RegisterBusinessProps } from "../../../src/routes/auth/signup";
import { teardown } from "../helpers/teardown";

Before("@db", async function (this: BaseWorld) {
    this.setCustomProp<Connection>(
        "connection",
        await DBConnection.GetConnection()
    );
});

// @Before({ tags: "@login" }, async function (this: BaseWorld) {
// this.setCustomProp<RegisterProps>("details", )
// });

After("@db", async function (this: BaseWorld) {
    this.setCustomProp<undefined>("connection", undefined);
});

After({ tags: "@signup_business or @login" }, async function (this: BaseWorld) {
    await teardown<RegisterBusinessProps>(this, "body", "userRole");
});
