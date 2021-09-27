import ModelTestPass from "../../../../test/helpers/model/test/pass";
import BaseWorld from "../../../../test/jest/support/base_world";
import DBConnection from "../../../../test/util/db_connection";
import Manual, { ManualAttributes } from "../manual";
import Policy, { PolicyAttributes } from "./policy";
import { teardown } from "../../../../test/helpers/model/test/teardown";
import {
    createModels,
    loadAttributes,
} from "../../../../test/helpers/model/test/setup";
import ModelTestParentPrevent from "../../../../test/helpers/model/test/parent_prevent";

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
    await ModelTestParentPrevent.delete<
        Manual,
        ManualAttributes,
        Policy,
        PolicyAttributes
    >(
        baseWorld,
        { type: Manual, toggleAttribute: "prevent_edit" },
        Policy,
        /PolicyDeleteError: Cannot delete a policy while the manual is locked from editing/
    );
});

test("Update Policy while Manual is locked doesn't work", async () => {
    await ModelTestParentPrevent.update<
        Manual,
        ManualAttributes,
        Policy,
        PolicyAttributes
    >(
        baseWorld,
        { type: Manual, toggleAttribute: "prevent_edit" },
        {
            type: Policy,
            attributesToUpdate: { title: "YOLO" },
        },
        /PolicyUpdateError: Cannot update a policy while the manual is locked from editing/
    );
});

test("Creating a policy when manual cannot be edited is true should fail", async () => {
    await ModelTestParentPrevent.create<
        Manual,
        ManualAttributes,
        Policy,
        PolicyAttributes
    >(
        baseWorld,
        { type: Manual, toggleAttribute: "prevent_edit" },
        Policy,
        /PolicyInsertError: Cannot insert a policy while the manual is locked/
    );
});
