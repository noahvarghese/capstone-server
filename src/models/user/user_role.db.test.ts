import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import ModelTestFail from "@test/model/helpers/test/fail";
import Model from "@test/model/helpers";
import UserRole, { UserRoleAttributes } from "./user_role";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, UserRole);
});
afterEach(async () => {
    if (!baseWorld) throw new Error(BaseWorld.errorMessage);
    await Model.teardown.call(baseWorld, UserRole);
    baseWorld.resetProps();
});

// Tests
test("Create User Role", async () => {
    await ModelTestPass.create<UserRole, UserRoleAttributes>(
        baseWorld,
        UserRole
    );
});

test("Update user role should fail", async () => {
    await ModelTestFail.update<UserRole, UserRoleAttributes>(
        baseWorld,
        UserRole,
        { role_id: -1 },
        /UserRoleUpdateError: Cannot update user role/
    );
});

test("Delete User Role", async () => {
    await ModelTestPass.delete<UserRole, UserRoleAttributes>(
        baseWorld,
        UserRole,

        ["user_id", "role_id"]
    );
});

test("Read User Role", async () => {
    await ModelTestPass.read<UserRole, UserRoleAttributes>(
        baseWorld,
        UserRole,

        ["user_id", "role_id"]
    );
});
