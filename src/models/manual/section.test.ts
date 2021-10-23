import BaseWorld from "../../../test/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import ModelTestPass from "../../../test/jest/helpers/model/test/pass";
import ManualSection, { ManualSectionAttributes } from "./section";
import { teardown } from "../../../test/jest/helpers/model/test/teardown";
import {
    createModels,
    loadAttributes,
} from "../../../test/jest/helpers/model/test/setup";
import Manual, { ManualAttributes } from "./manual";
import ModelTestParentPrevent from "../../../test/jest/helpers/model/test/parent_prevent";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, ManualSection);
    await createModels(baseWorld, ManualSection);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    await teardown(baseWorld, ManualSection);
    baseWorld = undefined;
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
