import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import ModelTestPass from "../../../test/helpers/model/test/pass";
import UserRole, { UserRoleAttributes } from "./user_role";
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

/* Dont test update as it is a concatenated primary  */
/* Meaning that an update should be treated as a DELETE and INSERT */

// test("Update User Role", async () => {
//     await testUpdateModel<UserRole, UserRoleAttributes>(
//         baseWorld,
//         UserRole,
//
//         "name",
//         "TEST"
//     );
// });
test.todo("Update user role, see policy read for example");

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
