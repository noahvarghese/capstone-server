import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestFail from "@test/model/helpers/test/fail";
import Model from "@test/model/helpers";
import UserRole, { UserRoleAttributes } from "./user_role";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(async () => {
    await DBConnection.close();
});

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, UserRole);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, UserRole);
    baseWorld.resetProps();
});

test("Update user role should fail", async () => {
    await ModelTestFail.update<UserRole, UserRoleAttributes>(
        baseWorld,
        UserRole,
        { role_id: -1 },
        /UserRoleUpdateError: Cannot update user role/
    );
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
