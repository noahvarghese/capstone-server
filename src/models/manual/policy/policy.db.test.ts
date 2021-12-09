import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Manual, { ManualAttributes } from "../manual";
import Policy, { PolicyAttributes } from "./policy";
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
    await Model.setup.call(baseWorld, Policy);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, Policy);
    baseWorld.resetProps();
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
