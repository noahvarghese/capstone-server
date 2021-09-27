import ModelActions from "../../../../test/helpers/model/actions";
import ModelTestPass from "../../../../test/helpers/model/test/pass";
import ModelTestFail from "../../../../test/helpers/model/test/fail";
import BaseWorld from "../../../../test/jest/support/base_world";
import DBConnection from "../../../../test/util/db_connection";
import Manual, { ManualAttributes } from "../manual";
import Policy, { PolicyAttributes } from "./policy";
import ModelError from "../../../../test/util/model_error";
import { teardown } from "../../../../test/helpers/model/test/teardown";
import {
    createModels,
    loadAttributes,
} from "../../../../test/helpers/model/test/setup";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());

    loadAttributes(baseWorld, Policy);
    await createModels(baseWorld, Policy);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await teardown(baseWorld, Policy);
    baseWorld = undefined;
});

// Tests
test("Create Policy", async () => {
    await ModelTestPass.create<Policy, PolicyAttributes>(baseWorld, Policy);
});

test("Update Policy", async () => {
    await ModelTestPass.update<Policy, PolicyAttributes>(
        baseWorld,
        Policy,

        {
            title: "TEST",
        }
    );
});

test("Delete Policy", async () => {
    await ModelTestPass.delete<Policy, PolicyAttributes>(
        baseWorld,
        Policy,

        ["id"]
    );
});

test("Read Policy", async () => {
    await ModelTestPass.read<Policy, PolicyAttributes>(baseWorld, Policy, [
        "id",
    ]);
});

test("Delete Policy while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelActions.update<Manual, ManualAttributes>(baseWorld, Manual, {
        prevent_edit: true,
    });

    try {
        await ModelTestFail.delete<Policy, PolicyAttributes>(
            baseWorld,
            Policy,

            /PolicyDeleteError: Cannot delete a policy while the manual is locked from editing/
        );

        await ModelActions.update<Manual, ManualAttributes>(baseWorld, Manual, {
            prevent_edit: false,
        });

        await ModelActions.delete<Policy>(baseWorld, Policy);
    } catch (e) {
        if (e instanceof ModelError) {
            if (e.deleted !== undefined && e.deleted !== false) {
                await ModelActions.delete<Policy>(baseWorld, Policy);
            }
        }
        throw e;
    }
});

test("Update Policy while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelActions.update<Manual, ManualAttributes>(baseWorld, Manual, {
        prevent_edit: true,
    });

    try {
        await ModelTestFail.update<Policy, PolicyAttributes>(
            baseWorld,
            Policy,

            { title: "YOLO" },
            /PolicyUpdateError: Cannot update a policy while the manual is locked from editing/
        );
    } catch (e) {
        if (
            /PolicyDeleteError: Cannot delete a policy while the manual is locked from editing/.test(
                e.message
            )
        ) {
            await ModelActions.update<Manual, ManualAttributes>(
                baseWorld,
                Manual,
                { prevent_edit: false }
            );

            await ModelActions.delete<Policy>(baseWorld, Policy);
        }
    }
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
