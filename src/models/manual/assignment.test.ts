import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ManualAssignment, { ManualAssignmentAttributes } from "./assignment";
import ModelTestFail from "@test/model/helpers/test/fail";
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
    await Model.setup.call(baseWorld, ManualAssignment);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, ManualAssignment);
    baseWorld.resetProps();
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

    await ModelTestFail.create<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment,
        /ManualAssignmentInsertError: Cannot add a manual_assignment without a role or department/
    );
});

test("Update manual assignment without role or department", async () => {
    await ModelTestFail.update<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment,
        { department_id: null, role_id: null },
        /ManualAssignmentUpdateError: Cannot update a manual_assignment without a role or department/
    );
});
