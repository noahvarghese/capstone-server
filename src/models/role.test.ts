import BaseWorld from "../../test/jest/support/base_world";
import DBConnection from "../../test/util/db_connection";
import ModelTestPass from "../../test/jest/helpers/model/test/pass";
import Role, { RoleAttributes } from "./role";
import {
    createModels,
    loadAttributes,
} from "../../test/jest/helpers/model/test/setup";
import { teardown } from "../../test/jest/helpers/model/test/teardown";
import ModelTestParentPrevent from "../../test/jest/helpers/model/test/parent_prevent";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, Role);
    await createModels(baseWorld, Role);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await teardown(baseWorld, Role);
    baseWorld = undefined;
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
