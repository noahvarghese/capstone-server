import { After, Before } from "@cucumber/cucumber";
import { Connection } from "typeorm";
import Business from "../../../src/models/business";
import DBConnection from "../../util/db_connection";
import BaseWorld from "../support/base_world";

Before("@db", async function (this: BaseWorld) {
    this.setCustomProp<Connection>(
        "connection",
        await DBConnection.GetConnection()
    );
});

After("@db", async function (this: BaseWorld) {
    const connection = this.getCustomProp<Connection>("connection");
    await connection.manager.remove(await connection.manager.find(Business));
    this.setCustomProp<undefined>("connection", undefined);
});
