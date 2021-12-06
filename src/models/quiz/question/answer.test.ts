import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Model from "@test/model/helpers";
import Quiz, { QuizAttributes } from "../quiz";
import QuizAnswer, { QuizAnswerAttributes } from "./answer";
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
    await Model.setup.call(baseWorld, QuizAnswer);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, QuizAnswer);
    baseWorld.resetProps();
});
test("Delete QuizAnswer while Manual is locked doesn't work", async () => {
    await ModelTestParentPrevent.delete<
        Quiz,
        QuizAttributes,
        QuizAnswer,
        QuizAnswerAttributes
    >(
        baseWorld,
        {
            type: Quiz,
            toggleAttribute: "prevent_edit",
        },
        QuizAnswer,
        /QuizAnswerDeleteError: Cannot delete an answer while the quiz is locked from editing/
    );
});

test("Update QuizAnswer while Quiz is locked doesn't work", async () => {
    await ModelTestParentPrevent.update(
        baseWorld,
        {
            type: Quiz,
            toggleAttribute: "prevent_edit",
        },
        { type: QuizAnswer, attributesToUpdate: { answer: "YOLO" } },
        /QuizAnswerUpdateError: Cannot update an answer while the quiz is locked from editing/
    );
});

test("Creating answer when quiz.prevent_edit is true should fail", async () => {
    await ModelTestParentPrevent.create<
        Quiz,
        QuizAttributes,
        QuizAnswer,
        QuizAnswerAttributes
    >(
        baseWorld,
        { type: Quiz, toggleAttribute: "prevent_edit" },
        QuizAnswer,
        /QuizAnswerInsertError: Cannot insert an answer while the quiz is locked/
    );
});
