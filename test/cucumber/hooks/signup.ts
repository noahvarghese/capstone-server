import { After, Before } from "@cucumber/cucumber";
import { Connection } from "typeorm/connection/Connection";
import Business, { BusinessAttributes } from "../../../src/models/business";
import Logs from "../../../src/util/logs/logs";
import { businessAttributes } from "../../sample_data/attributes";
import DBConnection from "../../util/db_connection";
import ModelActions from "../../helpers/model/actions";
import BaseWorld from "../support/base_world";

Before("@signup", async function (this: BaseWorld) {
    const connection = await DBConnection.GetConnection();

    this.setCustomProp<Connection>("connection", connection);
    this.setCustomProp<BusinessAttributes>(
        "businessAttributes",
        businessAttributes()
    );
    try {
        await ModelActions.create<Business, BusinessAttributes>(this, Business);
    } catch (e) {
        Logs.Error(e.message);
        throw new Error("Failed to create Business");
    }
});

After({ tags: "@signup" }, async function (this: BaseWorld) {
    try {
        await ModelActions.delete<Business>(this, Business);
    } catch (e) {
        Logs.Error(e.message);
        throw new Error("Failed to delete business");
    }
});
