import BaseWorld from "../../test/jest/support/base_world";
import DBConnection from "../../test/util/db_connection";
import ModelActions from "../../test/helpers/model/actions";
import ModelTestPass from "../../test/helpers/model/test/pass";
import ModelTestFail from "../../test/helpers/model/test/fail";
import Role, { RoleAttributes } from "./role";
import {
    createModels,
    loadAttributes,
} from "../../test/helpers/model/test/setup";
import { teardown } from "../../test/helpers/model/test/teardown";

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
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    // set prevent delete in environment data
    baseWorld.setCustomProp<RoleAttributes>("roleAttributes", {
        ...baseWorld.getCustomProp<RoleAttributes>("roleAttributes"),
        prevent_delete: true,
    });

    try {
        await ModelTestFail.delete(
            baseWorld,
            Role,
            /RoleDeleteError: Cannot delete role while delete lock is set/
        );

        await ModelActions.update<Role, RoleAttributes>(baseWorld, Role, {
            prevent_delete: false,
        });

        await ModelActions.delete<Role>(baseWorld, Role);
    } catch (e) {
        if (e.deleted !== undefined && e.deleted !== false) {
            await ModelActions.delete<Role>(baseWorld, Role);
        }
    }
});
