import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Content, { ContentAttributes } from "./content";
import Manual, { ManualAttributes } from "./manual";
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
    await Model.setup.call(baseWorld, Content);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, Content);
    baseWorld.resetProps();
});

test("Delete Content while Manual is locked doesn't work", async () => {
    await ModelTestParentPrevent.delete<
        Manual,
        ManualAttributes,
        Content,
        ContentAttributes
    >(
        baseWorld,
        { type: Manual, toggleAttribute: "prevent_edit" },
        Content,
        /ContentDeleteError: Cannot delete content while the manual is locked from editing/
    );
});

test("Update Content while Manual is locked doesn't work", async () => {
    await ModelTestParentPrevent.update<
        Manual,
        ManualAttributes,
        Content,
        ContentAttributes
    >(
        baseWorld,
        { type: Manual, toggleAttribute: "prevent_edit" },
        {
            type: Content,
            attributesToUpdate: { title: "YOLO" },
        },
        /ContentUpdateError: Cannot update content while the manual is locked from editing/
    );
});

test("Creating content when manual cannot be edited is true should fail", async () => {
    await ModelTestParentPrevent.create<
        Manual,
        ManualAttributes,
        Content,
        ContentAttributes
    >(
        baseWorld,
        { type: Manual, toggleAttribute: "prevent_edit" },
        Content,
        /ContentInsertError: Cannot insert content while the manual is locked/
    );
});
