import BaseWorld from "../../../../test/jest/support/base_world";
import DBConnection from "../../../../test/util/db_connection";
import ModelActions from "../../../../test/helpers/model/actions";
import ModelTestPass from "../../../../test/helpers/model/test/pass";
import Read, { ReadAttributes } from "./read";
import {
    createModels,
    loadAttributes,
} from "../../../../test/helpers/model/test/setup";
import PolicyRead from "./read";
import { teardown } from "../../../../test/helpers/model/test/teardown";

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
    await ModelTestPass.create<Read, ReadAttributes>(baseWorld, Read);
});

test("Update model should fail", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    try {
        await ModelTestPass.update(baseWorld, Read, { policy_id: 2 });
    } catch (e) {
        const errorRegex = /PolicyReadUpdateError/;
        expect(errorRegex.test(e.message)).toBe(true);
        await ModelActions.delete<Read>(baseWorld, Read);
    }
});

test("Delete Policy Read", async () => {
    await ModelTestPass.delete<Read, ReadAttributes>(baseWorld, Read, [
        "policy_id",
        "user_id",
    ]);
});

test("Read Policy Read", async () => {
    await ModelTestPass.read<Read, ReadAttributes>(baseWorld, Read, [
        "user_id",
        "policy_id",
    ]);
});
