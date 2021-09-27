import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import ModelTestPass from "../../../test/helpers/model/test/pass";
import ManualAssignment, { ManualAssignmentAttributes } from "./assignment";
import {
    createModels,
    loadAttributes,
} from "../../../test/helpers/model/test/setup";
import { teardown } from "../../../test/helpers/model/test/teardown";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, ManualAssignment);
    await createModels(baseWorld, ManualAssignment);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await teardown(baseWorld, ManualAssignment);
    baseWorld = undefined;
});

// Tests
test("Create Manual Assignment", async () => {
    await ModelTestPass.create<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment
    );
});

// Should fail
test("Create Manual Assignment Without Department Or Role", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    baseWorld.setCustomProp<ManualAssignmentAttributes>(
        "manualAssignmentAttributes",
        {
            ...baseWorld.getCustomProp<ManualAssignmentAttributes>(
                "manualAssignmentAttributes"
            ),
            department_id: null,
            role_id: null,
        }
    );
    try {
        await ModelTestPass.create<
            ManualAssignment,
            ManualAssignmentAttributes
        >(baseWorld, ManualAssignment);
    } catch (e) {
        expect(e).toBeTruthy();
    }
});

/* Dont test update as it is a concatenated primary  */
/* Meaning that an update should be treated as a DELETE and INSERT */

test("Update Manual Assignment", async () => {
    await ModelTestPass.update<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment,

        { role_id: null }
    );
});

test("Delete Manual Assignment", async () => {
    await ModelTestPass.delete<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment,

        ["id"]
    );
});

test("Read Manual Assignment", async () => {
    await ModelTestPass.read<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment,

        ["id"]
    );
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
