import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import Permission, { PermissionAttributes } from "./permission";
import Model from "@test/model/helpers";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, Permission);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, Permission);
    baseWorld.resetProps();
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

        { global_assign_resources_to_department: false }
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
