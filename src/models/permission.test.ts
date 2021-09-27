import BaseWorld from "../../test/jest/support/base_world";
import DBConnection from "../../test/util/db_connection";
import ModelTestPass from "../../test/helpers/model/test/pass";
import Permission, { PermissionAttributes } from "./permission";
import { teardown } from "../../test/helpers/model/test/teardown";
import {
    createModels,
    loadAttributes,
} from "../../test/helpers/model/test/setup";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, Permission);
    await createModels(baseWorld, Permission);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    await teardown(baseWorld, Permission);
    baseWorld = undefined;
});

// Tests
test("Create Permission", async () => {
    await ModelTestPass.create<Permission, PermissionAttributes>(
        baseWorld,
        Permission
    );
});

test("Update Permission", async () => {
    await ModelTestPass.update<Permission, PermissionAttributes>(
        baseWorld,
        Permission,

        { assign_resources_to_department: false }
    );
});

test("Delete Permission", async () => {
    await ModelTestPass.delete<Permission, PermissionAttributes>(
        baseWorld,
        Permission,

        ["id"]
    );
});

test("Read Permission", async () => {
    await ModelTestPass.read<Permission, PermissionAttributes>(
        baseWorld,
        Permission,

        ["id"]
    );
});
