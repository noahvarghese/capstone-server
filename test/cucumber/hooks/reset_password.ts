import { After } from "@cucumber/cucumber";
import { Connection } from "typeorm";
import Event from "../../../src/models/event";
import BaseWorld from "../../cucumber/support/base_world";

After("@reset_password", async function (this: BaseWorld) {
    const connection = this.getCustomProp<Connection>("connection");
    await connection.manager.remove(await connection.manager.find(Event));
});
