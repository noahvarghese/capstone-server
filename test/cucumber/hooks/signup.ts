import { After, Before } from "@cucumber/cucumber";
import { Connection } from "typeorm/connection/Connection";
import Business, { BusinessAttributes } from "../../../src/models/business";
import Logs from "../../../src/util/logs/logs";
import { businessAttributes } from "../../sample_data.ts/attributes";
import DBConnection from "../../util/db_connection";
import { createModel, deleteModel } from "../../util/model_actions";
import BaseWorld from "../support/base_world";

Before("@signup", async function (this: BaseWorld) {
    const connection = await DBConnection.GetConnection();

    this.setCustomProp<Connection>("connection", connection);
    this.setCustomProp<BusinessAttributes>(
        "businessAttributes",
        businessAttributes
    );
    try {
        createModel<Business, BusinessAttributes>(this, Business, "business");
    } catch (e) {
        Logs.Error(e.message);
        throw new Error("Failed to create Business");
    }
});

After("@signup", async function (this: BaseWorld) {
    try {
        await deleteModel<Business>(this, "business");
    } catch (e) {
        Logs.Error(e.message);
        throw new Error("Failed to delete business");
    }
});
