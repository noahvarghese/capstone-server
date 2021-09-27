import BaseWorld from "../../../../test/jest/support/base_world";
import DBConnection from "../../../../test/util/db_connection";
import ModelTestPass from "../../../../test/helpers/model/test/pass";
import Quiz, { QuizAttributes } from "../quiz";
import QuizQuestion, { QuizQuestionAttributes } from "./question";
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
    loadAttributes(baseWorld, QuizQuestion);
    await createModels(baseWorld, QuizQuestion);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await teardown(baseWorld, QuizQuestion);
    baseWorld = undefined;
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
