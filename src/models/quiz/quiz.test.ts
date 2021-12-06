import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Quiz, { QuizAttributes } from "./quiz";
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
    await Model.setup.call(baseWorld, Quiz);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, Quiz);
    baseWorld.resetProps();
});

test("Prevent Deletion of Quiz", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelTestParentPrevent.delete<
        Quiz,
        QuizAttributes,
        Quiz,
        QuizAttributes
    >(
        baseWorld,
        { type: Quiz, toggleAttribute: "prevent_delete" },
        Quiz,
        /QuizDeleteError: Cannot delete quiz while delete lock is set/
    );
});

test("prevent editing of quiz", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelTestParentPrevent.update<
        Quiz,
        QuizAttributes,
        Quiz,
        QuizAttributes
    >(
        baseWorld,
        { type: Quiz, toggleAttribute: "prevent_edit" },
        { type: Quiz, attributesToUpdate: { title: "YOLO" } },
        /QuizUpdateError: Quiz is locked from editing/
    );
});
