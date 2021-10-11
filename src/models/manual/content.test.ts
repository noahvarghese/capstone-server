import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import ModelTestPass from "../../../test/jest/helpers/model/test/pass";
import Content, { ContentAttributes } from "./content";
import Manual, { ManualAttributes } from "./manual";
import {
    createModels,
    loadAttributes,
} from "../../../test/jest/helpers/model/test/setup";
import { teardown } from "../../../test/jest/helpers/model/test/teardown";
import ModelTestParentPrevent from "../../../test/jest/helpers/model/test/parent_prevent";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, Content);
    await createModels(baseWorld, Content);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    await teardown(baseWorld, Content);
    baseWorld = undefined;
});

// Tests
test("Create Content", async () => {
    await ModelTestPass.create<Content, ContentAttributes>(baseWorld, Content);
});

test("Update Content", async () => {
    await ModelTestPass.update<Content, ContentAttributes>(baseWorld, Content, {
        title: "TEST",
    });
});

test("Delete Content", async () => {
    await ModelTestPass.delete<Content, ContentAttributes>(baseWorld, Content, [
        "id",
    ]);
});

test("Read Content", async () => {
    await ModelTestPass.read<Content, ContentAttributes>(baseWorld, Content, [
        "id",
    ]);
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
