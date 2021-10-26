import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/helpers/model/test/pass";
import Model from "@test/helpers/model";
import Quiz, { QuizAttributes } from "../quiz";
import QuizQuestion, { QuizQuestionAttributes } from "./question";
import ModelTestParentPrevent from "@test/helpers/model/test/parent_prevent";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    await Model.setup.call(baseWorld, QuizQuestion);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, QuizQuestion);
    baseWorld.resetProps();
});

// Tests
test("Create Quiz Question", async () => {
    await ModelTestPass.create<QuizQuestion, QuizQuestionAttributes>(
        baseWorld,
        QuizQuestion
    );
});

test("Update Quiz Question", async () => {
    await ModelTestPass.update<QuizQuestion, QuizQuestionAttributes>(
        baseWorld,
        QuizQuestion,
        { question: "TEST" }
    );
});

test("Delete Quiz Question", async () => {
    await ModelTestPass.delete<QuizQuestion, QuizQuestionAttributes>(
        baseWorld,
        QuizQuestion,
        ["id"]
    );
});

test("Read Quiz Question", async () => {
    await ModelTestPass.read<QuizQuestion, QuizQuestionAttributes>(
        baseWorld,
        QuizQuestion,
        ["id"]
    );
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
