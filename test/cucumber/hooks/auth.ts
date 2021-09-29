import { Before, After } from "@cucumber/cucumber";
import { Connection } from "typeorm";
import User, { UserAttributes } from "../../../src/models/user/user";
import DBConnection from "../../util/db_connection";
import ModelActions from "../../helpers/model/actions";
import { loadAttributes, createModels } from "../../helpers/model/test/setup";
import { teardown } from "../../helpers/model/test/teardown";
import BaseWorld from "../support/base_world";

Before("@auth", async function (this: BaseWorld) {
    const connection = await DBConnection.GetConnection();

    this.setCustomProp<Connection>("connection", connection);

    loadAttributes<User>(this, User);
    await createModels<User, UserAttributes>(this, User);
    await ModelActions.create<User, UserAttributes>(this, User);
});

After("@auth", async function (this: BaseWorld) {
    await ModelActions.delete<User>(this, User);
    await teardown<User>(this, User);
});
