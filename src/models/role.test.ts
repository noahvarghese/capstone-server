import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import Role, { RoleAttributes } from "./role";
import ModelTestParentPrevent from "@test/model/helpers/test/parent_prevent";
import Model from "@test/model/helpers";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, Role);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, Role);
    baseWorld.resetProps();
});

// Tests
test("Create Role", async () => {
    await ModelTestPass.create<Role, RoleAttributes>(baseWorld, Role);
});

test("Update Role", async () => {
    await ModelTestPass.update<Role, RoleAttributes>(baseWorld, Role, {
        name: "TEST",
    });
});

test("Delete Role", async () => {
    await ModelTestPass.delete<Role, RoleAttributes>(baseWorld, Role, ["id"]);
});

test("Read Role", async () => {
    await ModelTestPass.read<Role, RoleAttributes>(baseWorld, Role, ["id"]);
});

test("Prevent Deletion of Role", async () => {
    await ModelTestParentPrevent.delete<
        Role,
        RoleAttributes,
        Role,
        RoleAttributes
    >(
        baseWorld,
        { type: Role, toggleAttribute: "prevent_delete" },
        Role,
        /RoleDeleteError: Cannot delete role while delete lock is set/
    );
});

test("Prevent Update of Role", async () => {
    await ModelTestParentPrevent.update<
        Role,
        RoleAttributes,
        Role,
        RoleAttributes
    >(
        baseWorld,
        { type: Role, toggleAttribute: "prevent_edit" },
        { type: Role, attributesToUpdate: { name: "YOLO" } },
        /RoleUpdateError: Cannot edit role while edit lock is set/
    );
});
