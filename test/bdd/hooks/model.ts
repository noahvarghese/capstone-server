import { After, Before } from "@cucumber/cucumber";
import { Connection, createConnection } from "typeorm";
import { connection } from "../../../src/config/database";
import BaseModel from "../../../src/models/abstract/base_model";
import Business from "../../../src/models/business";
import BaseWorld from "../support/base_world";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deleteModel = async <T extends BaseModel>(that: BaseWorld, type: any) => {
    const model = that.getCustomProp<T>("model");
    const connection = that.getCustomProp<Connection>("connection");
    await connection.manager.delete(type, model.id);
};

Before(
    { tags: "@Update or @Delete or @Find" },
    async function (this: BaseWorld) {
        // const;
    }
);

Before({ tags: "@Model" }, async function (this: BaseWorld) {
    this.setCustomProp<Connection>(
        "connection",
        await createConnection({ name: "Test", ...connection })
    );
});

After({ tags: "@Model" }, async function (this: BaseWorld) {
    const connection = this.getCustomProp<Connection>("connection");
    connection.close();
});

After({ tags: "@Create and @Business" }, async function (this: BaseWorld) {
    await deleteModel(this, Business);
});
