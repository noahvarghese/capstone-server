import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import ModelActions from "../../../test/helpers/model/actions";
import ModelTestPass from "../../../test/helpers/model/test/pass";
import ModelTestFail from "../../../test/helpers/model/test/fail";
import ManualSection, { ManualSectionAttributes } from "./section";
import ModelError from "../../../test/util/model_error";
import { teardown } from "../../../test/helpers/model/test/teardown";
import {
    createModels,
    loadAttributes,
} from "../../../test/helpers/model/test/setup";
import Manual, { ManualAttributes } from "./manual";

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

    await ModelActions.update<Manual, ManualAttributes>(baseWorld, Manual, {
        prevent_edit: true,
    });

    try {
        await ModelTestFail.delete<ManualSection, ManualSectionAttributes>(
            baseWorld,
            ManualSection,
            /ManualSectionDeleteError: Cannot delete a section while the manual is locked from editing/
        );

        await ModelActions.update<Manual, ManualAttributes>(baseWorld, Manual, {
            prevent_edit: false,
        });

        await ModelActions.delete<ManualSection>(baseWorld, ManualSection);
    } catch (e) {
        if (e instanceof ModelError) {
            if (e.deleted !== undefined && e.deleted !== false) {
                await ModelActions.delete<ManualSection>(
                    baseWorld,
                    ManualSection
                );
            }
        }
        throw e;
    }
});

test("Update Section while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelActions.update<Manual, ManualAttributes>(baseWorld, Manual, {
        prevent_edit: true,
    });

    try {
        await ModelTestFail.update<ManualSection, ManualSectionAttributes>(
            baseWorld,
            ManualSection,
            { title: "YOLO" },
            /ManualSectionUpdateError: Cannot update a section while the manual is locked from editing/
        );
    } catch (e) {
        if (
            /ManualSectionDeleteError: Cannot delete a section while the manual is locked from editing/.test(
                e.message
            )
        ) {
            await ModelActions.update<Manual, ManualAttributes>(
                baseWorld,
                Manual,
                { prevent_edit: false }
            );

            await ModelActions.delete<ManualSection>(baseWorld, ManualSection);
        }
    }
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
