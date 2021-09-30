import { After, Before } from "@cucumber/cucumber";
import { Connection } from "typeorm";
import DBConnection from "../../util/db_connection";
import BaseWorld from "../support/base_world";
import { teardown } from "../helpers/teardown";
import { businessAttributes } from "@test/sample_data/model/attributes";

Before(async function (this: BaseWorld, { pickle }) {
    const { tags } = pickle;

    if (tags) {
        const tagNames = tags
            .map((t) => t.name)
            .filter((t) => t !== null && t !== undefined) as string[];

        this.setTags(tagNames ?? new Array<string>());
    }
    this.setCustomProp<string[]>("businessNames", [businessAttributes().name]);
    this.setCustomProp<Connection>(
        "connection",
        await DBConnection.GetConnection()
    );
});

After(async function (this: BaseWorld) {
    await teardown.call(this);
    this.setCustomProp<undefined>("connection", undefined);
    this.setTags([]);
});
