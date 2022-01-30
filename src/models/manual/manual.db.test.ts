import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import ModelTestFail from "@test/model/helpers/test/fail";
import Manual, { ManualAttributes } from "./manual";
import ModelTestParentPrevent from "@test/model/helpers/test/parent_prevent";
import Model from "@test/model/helpers";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, Manual);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, Manual);
    baseWorld.resetProps();
});

// Tests
test("Create Manual", async () => {
    await ModelTestPass.create<Manual, ManualAttributes>(baseWorld, Manual);
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
