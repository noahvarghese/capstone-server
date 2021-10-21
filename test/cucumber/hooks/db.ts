import { After, Before } from "@cucumber/cucumber";
import DBConnection from "../../util/db_connection";
import BaseWorld from "../support/base_world";
import { teardown } from "../helpers/teardown";
import { businessAttributes } from "@test/sample_data/model/attributes";
import { setup } from "../helpers/setup";

Before({ timeout: 20000 }, async function (this: BaseWorld, { pickle }) {
    const { tags } = pickle;

    if (tags) {
        const tagNames = tags
            .map((t) => t.name)
            .filter((t) => t !== null && t !== undefined) as string[];

        this.setTags(tagNames ?? new Array<string>());
    }

    this.setCustomProp<string[]>("businessNames", [businessAttributes().name]);
    this.setConnection(await DBConnection.GetConnection());

    await setup.call(this);
});

After({ timeout: 30000 }, async function (this: BaseWorld) {
    await teardown.call(this);
    this.clearConnection();
    this.setTags([]);
});
