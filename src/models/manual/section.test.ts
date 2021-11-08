import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/helpers/model/test/pass";
import ManualSection, { ManualSectionAttributes } from "./section";
import Model from "@test/helpers/model";
import Manual, { ManualAttributes } from "./manual";
import ModelTestParentPrevent from "@test/helpers/model/test/parent_prevent";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, ManualSection);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, ManualSection);
    baseWorld.resetProps();
});

// Tests
test("Create Section", async () => {
    await ModelTestPass.create<ManualSection, ManualSectionAttributes>(
        baseWorld,
        ManualSection
    );
});

test("Update Section", async () => {
    await ModelTestPass.update<ManualSection, ManualSectionAttributes>(
        baseWorld,
        ManualSection,
        {
            title: "TEST",
        }
    );
});

test("Delete Section", async () => {
    await ModelTestPass.delete<ManualSection, ManualSectionAttributes>(
        baseWorld,
        ManualSection,
        ["id"]
    );
});

test("Read Section", async () => {
    await ModelTestPass.read<ManualSection, ManualSectionAttributes>(
        baseWorld,
        ManualSection,
        ["id"]
    );
});

test("Delete Section while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    await ModelTestParentPrevent.delete<
        Manual,
        ManualAttributes,
        ManualSection,
        ManualSectionAttributes
    >(
        baseWorld,
        { type: Manual, toggleAttribute: "prevent_edit" },
        ManualSection,
        /ManualSectionDeleteError: Cannot delete a section while the manual is locked from editing/
    );
});

test("Update Section while Manual is locked doesn't work", async () => {
    await ModelTestParentPrevent.update<
        Manual,
        ManualAttributes,
        ManualSection,
        ManualSectionAttributes
    >(
        baseWorld,
        { type: Manual, toggleAttribute: "prevent_edit" },
        { type: ManualSection, attributesToUpdate: { title: "YOLO" } },
        /ManualSectionUpdateError: Cannot update a section while the manual is locked from editing/
    );
});

test("Creating section when manual cannot be edited is true should fail", async () => {
    await ModelTestParentPrevent.create<
        Manual,
        ManualAttributes,
        ManualSection,
        ManualSectionAttributes
    >(
        baseWorld,
        { type: Manual, toggleAttribute: "prevent_edit" },
        ManualSection,
        /ManualSectionInsertError: Cannot insert a section while the manual is locked/
    );
});
