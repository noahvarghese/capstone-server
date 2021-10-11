import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import ModelTestPass from "../../../test/jest/helpers/model/test/pass";
import UserRole, { UserRoleAttributes } from "./user_role";
import {
    createModels,
    loadAttributes,
} from "../../../test/jest/helpers/model/test/setup";
import { teardown } from "../../../test/jest/helpers/model/test/teardown";
import ModelTestFail from "../../../test/jest/helpers/model/test/fail";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, UserRole);
    await createModels(baseWorld, UserRole);
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    await teardown<UserRole>(baseWorld, UserRole);
    baseWorld = undefined;
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

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
