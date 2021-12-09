import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Role, { RoleAttributes } from "./role";
import ModelTestParentPrevent from "@test/model/helpers/test/parent_prevent";
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
    await Model.setup.call(baseWorld, Role);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, Role);
    baseWorld.resetProps();
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
