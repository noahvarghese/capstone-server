import { After, Before } from "@cucumber/cucumber";
import { Connection } from "typeorm/connection/Connection";
import Business, { BusinessAttributes } from "../../../src/models/business";
import User from "../../../src/models/user/user";
import Logs from "../../../src/util/logs/logs";
import { businessAttributes } from "../../sample_data/attributes";
import DBConnection from "../../util/db_connection";
import { createModel, deleteModel } from "../../util/model_actions";
import BaseWorld from "../support/base_world";
import Event from "../../../src/models/event";

Before("@signup", async function (this: BaseWorld) {
    const connection = await DBConnection.GetConnection();

    this.setCustomProp<Connection>("connection", connection);
    this.setCustomProp<BusinessAttributes>(
        "businessAttributes",
        businessAttributes
    );
    try {
        await createModel<
            Business,
            BusinessAttributes
        >(this, Business, "business");
    } catch (e) {
        Logs.Error(e.message);
        throw new Error("Failed to create Business");
    }
});

After({ tags: "@signup" }, async function (this: BaseWorld) {
    try {
        await deleteModel<Business>(this, "business");
    } catch (e) {
        Logs.Error(e.message);
        throw new Error("Failed to delete business");
    }
});

After(
    { tags: "@db or @signup_event_cleanup" },
    async function (this: BaseWorld) {
        const connection = this.getCustomProp<Connection>("connection");

        await connection.manager.remove(
            await connection.manager.find<Event>(Event)
        );
        await connection.manager.remove(
            await connection.manager.find<User>(User)
        );
    }
);
