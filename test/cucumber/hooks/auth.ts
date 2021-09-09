import { Before, After } from "@cucumber/cucumber";
import { Connection } from "typeorm";
import Business, { BusinessAttributes } from "../../../src/models/business";
import User, { UserAttributes } from "../../../src/models/user/user";
import {
    businessAttributes,
    userAttributes,
} from "../../sample_data/attributes";
import DBConnection from "../../util/db_connection";
import { createModel, deleteModel } from "../../util/model_actions";
import BaseWorld from "../support/base_world";

Before("@auth", async function (this: BaseWorld) {
    const connection = await DBConnection.GetConnection();

    this.setCustomProp<Connection>("connection", connection);
    this.setCustomProp<BusinessAttributes>(
        "businessAttributes",
        businessAttributes
    );

    const business = await createModel<Business, BusinessAttributes>(
        this,
        Business,
        "business"
    );
    this.setCustomProp<UserAttributes>("userAttributes", {
        ...userAttributes,
        business_id: business.id,
    });

    await createModel<User, UserAttributes>(this, User, "user");
});

After("@auth", async function (this: BaseWorld) {
    await deleteModel<User>(this, "user");
    await deleteModel<Business>(this, "business");
});
