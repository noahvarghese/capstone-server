import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Model from "@test/model/helpers";
import Quiz, { QuizAttributes } from "../quiz";
import QuizQuestion, { QuizQuestionAttributes } from "./question";
import ModelTestParentPrevent from "@test/model/helpers/test/parent_prevent";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(async () => {
    await DBConnection.close();
});

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, QuizQuestion);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, QuizQuestion);
    baseWorld.resetProps();
});

test("Delete Question while Quiz is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelTestParentPrevent.delete<
        Quiz,
        QuizAttributes,
        QuizQuestion,
        QuizQuestionAttributes
    >(
        baseWorld,
        { type: Quiz, toggleAttribute: "prevent_edit" },
        QuizQuestion,
        /QuizQuestionDeleteError: Cannot delete a question while the quiz is locked from editing/
    );
});

test("Update Question while Quiz is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    await ModelTestParentPrevent.update<
        Quiz,
        QuizAttributes,
        QuizQuestion,
        QuizQuestionAttributes
    >(
        baseWorld,
        { type: Quiz, toggleAttribute: "prevent_edit" },
        { type: QuizQuestion, attributesToUpdate: { question: "Hello" } },
        /QuizQuestionUpdateError: Cannot update a question while the quiz is locked from editing/
    );
});

test("Creating question when quiz.prevent_edit is true should fail", async () => {
    await ModelTestParentPrevent.create<
        Quiz,
        QuizAttributes,
        QuizQuestion,
        QuizQuestionAttributes
    >(
        baseWorld,
        { type: Quiz, toggleAttribute: "prevent_edit" },
        QuizQuestion,
        /QuizQuestionInsertError: Cannot insert a question while the quiz is locked/
    );
});
