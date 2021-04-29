import { Before } from "@cucumber/cucumber";
import { Connection, getConnection } from "typeorm";
import BaseWorld from "../support/base_world";

Before({ tags: "@Model" }, async function (this: BaseWorld) {
    this.setCustomProp<Connection>("connection", getConnection());
});
