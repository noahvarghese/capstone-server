import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import Permission, { PermissionAttributes } from "./permission";
import Model from "@test/model/helpers";
import Role, { RoleAttributes } from "./role";
import ModelActions from "@test/model/helpers/actions";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

describe("USing permission setup", () => {
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

            { global_assign_resources_to_role: false }
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
});

describe("Using role setup", () => {
    // State Setup
    beforeEach(async () => {
        baseWorld = new BaseWorld(await DBConnection.get());
        await Model.setup.call(baseWorld, Role);
    });

    afterEach(async () => {
        await Model.teardown.call(baseWorld, Role);
        baseWorld.resetProps();
    });

    test("Role edit lock prevents permissions from being edited", async () => {
        if (!baseWorld) throw new Error(BaseWorld.errorMessage);

        baseWorld.setCustomProp<RoleAttributes>("roleAttributes", {
            ...baseWorld.getCustomProp<RoleAttributes>("roleAttributes"),
            prevent_edit: true,
        });

        await ModelActions.create<Role, RoleAttributes>(baseWorld, Role);

        let errorThrown = false;

        try {
            await ModelActions.update<Permission, PermissionAttributes>(
                baseWorld,
                Permission,
                {}
            );
        } catch (e) {
            errorThrown = true;
            expect((e as Partial<{ message?: string }>).message).toMatch(
                /PermissionUpdateError: Cannot edit permissions while edit lock is set/
            );
        }

        await ModelActions.delete<Role>(baseWorld, Role);
        expect(errorThrown).toBe(true);
    });
});
