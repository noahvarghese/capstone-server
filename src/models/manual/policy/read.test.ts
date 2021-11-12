import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import ModelTestFail from "@test/model/helpers/test/fail";
import PolicyRead, { PolicyReadAttributes } from "./read";
import Model from "@test/model/helpers";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, PolicyRead);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, PolicyRead);
    baseWorld.resetProps();
});

// Tests
test("Create Policy Read", async () => {
    await ModelTestPass.create<PolicyRead, PolicyReadAttributes>(
        baseWorld,
        PolicyRead
    );
});

test("Update model should fail", async () => {
    await ModelTestFail.update<PolicyRead, PolicyReadAttributes>(
        baseWorld,
        PolicyRead,
        { policy_id: -1 },
        /PolicyReadUpdateError: Cannot update policy_read/
    );
});

test("Delete Policy Read", async () => {
    await ModelTestPass.delete<PolicyRead, PolicyReadAttributes>(
        baseWorld,
        PolicyRead,
        ["policy_id", "user_id"]
    );
});

test("Read Policy Read", async () => {
    await ModelTestPass.read<PolicyRead, PolicyReadAttributes>(
        baseWorld,
        PolicyRead,
        ["user_id", "policy_id"]
    );
});
