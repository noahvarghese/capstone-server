import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import ModelTestFail from "@test/model/helpers/test/fail";
import ContentRead, { ContentReadAttributes } from "./read";
import Model from "@test/model/helpers";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, ContentRead);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, ContentRead);
    baseWorld.resetProps();
});

// Tests
test("Create Policy Read", async () => {
    await ModelTestPass.create<ContentRead, ContentReadAttributes>(
        baseWorld,
        ContentRead
    );
});

test("Update model should fail", async () => {
    await ModelTestFail.update<ContentRead, ContentReadAttributes>(
        baseWorld,
        ContentRead,
        { content_id: -1 },
        /ContentReadUpdateError: Cannot update policy_read/
    );
});

test("Delete Policy Read", async () => {
    await ModelTestPass.delete<ContentRead, ContentReadAttributes>(
        baseWorld,
        ContentRead,
        ["content_id", "user_id"]
    );
});

test("Read Policy Read", async () => {
    await ModelTestPass.read<ContentRead, ContentReadAttributes>(
        baseWorld,
        ContentRead,
        ["user_id", "content_id"]
    );
});
