import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import ManualAssignment, { ManualAssignmentAttributes } from "./assignment";
import Model from "@test/model/helpers";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, ManualAssignment);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, ManualAssignment);
    baseWorld.resetProps();
});

// Tests
test("Create Manual Assignment", async () => {
    await ModelTestPass.create<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment
    );
});

test("Delete Manual Assignment", async () => {
    await ModelTestPass.delete<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment,
        ["manual_id", "role_id"]
    );
});

test("Read Manual Assignment", async () => {
    await ModelTestPass.read<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment,
        ["manual_id", "role_id"]
    );
});
