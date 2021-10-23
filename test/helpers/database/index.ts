import { businessAttributes } from "@test/sample_data/model/attributes";
import DBConnection from "@test/util/db_connection";
import BaseWorld from "@test/support/base_world";
import { setup } from "@test/helpers/api/setup";
import { teardown } from "@test/helpers/api/teardown";

async function before(this: BaseWorld, setupTag: string) {
    this.setCustomProp<string[]>("businessNames", [businessAttributes().name]);
    this.setConnection(await DBConnection.GetConnection());

    await setup.call(this, setupTag);
});

 async function after(this: BaseWorld, teardownTag: string) {
    await teardown.call(this, teardownTag);
    this.clearConnection();
});

