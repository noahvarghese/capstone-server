import BaseWorld from "../../../../test/jest/support/base_world";
import DBConnection from "../../../../test/util/db_connection";
import ModelTestPass from "../../../../test/helpers/model/test/pass";
import {
    createModels,
    loadAttributes,
} from "../../../../test/helpers/model/test/setup";
import { teardown } from "../../../../test/helpers/model/test/teardown";
import ModelTestFail from "../../../../test/helpers/model/test/fail";
import PolicyRead, { PolicyReadAttributes } from "./read";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, PolicyRead);
    await createModels(baseWorld, PolicyRead);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await teardown(baseWorld, PolicyRead);
    baseWorld = undefined;
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
