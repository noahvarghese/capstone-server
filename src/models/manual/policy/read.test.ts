import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestFail from "@test/model/helpers/test/fail";
import PolicyRead, { PolicyReadAttributes } from "./read";
import Model from "@test/model/helpers";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(async () => {
    await DBConnection.close();
});

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, PolicyRead);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, PolicyRead);
    baseWorld.resetProps();
});

test("Update model should fail", async () => {
    await ModelTestFail.update<PolicyRead, PolicyReadAttributes>(
        baseWorld,
        PolicyRead,
        { policy_id: -1 },
        /PolicyReadUpdateError: Cannot update policy_read/
    );
});
