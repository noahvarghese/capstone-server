import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import ModelTestPass from "../../../test/jest/helpers/model/test/pass";
import ModelTestFail from "../../../test/jest/helpers/model/test/fail";
import Manual, { ManualAttributes } from "./manual";
import { teardown } from "../../../test/jest/helpers/model/test/teardown";
import {
    createModels,
    loadAttributes,
} from "../../../test/jest/helpers/model/test/setup";
import ModelTestParentPrevent from "../../../test/jest/helpers/model/test/parent_prevent";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, Manual);
    await createModels(baseWorld, Manual);
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    await teardown(baseWorld, Manual);
    baseWorld = undefined;
});

// Tests
test("Create Manual", async () => {
    await ModelTestPass.create<Manual, ManualAttributes>(baseWorld, Manual);
});

// Should fail
test("Create Manual Without Department Or Role", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    baseWorld.setCustomProp<ManualAttributes>("manualAttributes", {
        ...baseWorld.getCustomProp<ManualAttributes>("manualAttributes"),
        department_id: null,
        role_id: null,
    });

    await ModelTestFail.create(
        baseWorld,
        Manual,
        /ManualInsertError: Cannot add a manual without a role or department/
    );
});

test("Update Manual Without Department Or Role", async () => {
    await ModelTestFail.update<Manual, ManualAttributes>(
        baseWorld,
        Manual,
        {
            role_id: null,
            department_id: null,
        },
        /ManualUpdateError: Cannot update a manual without a role and department/
    );
});

/* Dont test update as it is a concatenated primary  */
/* Meaning that an update should be treated as a DELETE and INSERT */

test("Update Manual", async () => {
    await ModelTestPass.update<Manual, ManualAttributes>(baseWorld, Manual, {
        title: "TEST",
    });
});

test("Delete Manual", async () => {
    await ModelTestPass.delete<Manual, ManualAttributes>(baseWorld, Manual, [
        "id",
    ]);
});

test("Read User Role", async () => {
    await ModelTestPass.read<Manual, ManualAttributes>(baseWorld, Manual, [
        "id",
    ]);
});

test("Prevent Deletion of Manual", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelTestParentPrevent.delete<
        Manual,
        ManualAttributes,
        Manual,
        ManualAttributes
    >(
        baseWorld,
        { type: Manual, toggleAttribute: "prevent_delete" },
        Manual,
        /ManualDeleteError: Cannot delete manual while delete lock is set/
    );
});

test("Prevent edit of manual", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    // set prevent delete in environment data
    baseWorld.setCustomProp<ManualAttributes>("manualAttributes", {
        ...baseWorld.getCustomProp<ManualAttributes>("manualAttributes"),
        prevent_edit: true,
    });

    await ModelTestFail.update<Manual, ManualAttributes>(
        baseWorld,
        Manual,
        {
            title: "YOLO",
        },
        /ManualUpdateError: Manual is locked from editing./
    );
});
