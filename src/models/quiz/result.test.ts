import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import QuizResult, { QuizResultAttributes } from "./result";
import ModelTestFail from "@test/helpers/model/test/fail";
import ModelTestPass from "@test/helpers/model/test/pass";
import Model from "@test/helpers/model";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    await Model.setup.call(baseWorld, QuizResult);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, QuizResult);
    baseWorld.resetProps();
});

test("Create Quiz Result", async () => {
    await ModelTestPass.create<QuizResult, QuizResultAttributes>(
        baseWorld,
        QuizResult
    );
});

// because results should not be changable as a business rule
test("Update Quiz Result should fail", async () => {
    await ModelTestFail.update<QuizResult, QuizResultAttributes>(
        baseWorld,
        QuizResult,
        {
            quiz_attempt_id: -1,
        },
        /QuizResultUpdateError: Cannot update quiz_result/
    );
});

test("Delete Quiz Result", async () => {
    await ModelTestPass.delete<QuizResult, QuizResultAttributes>(
        baseWorld,
        QuizResult,
        ["quiz_attempt_id", "quiz_question_id", "quiz_answer_id"]
    );
});

test("Read Quiz Result", async () => {
    await ModelTestPass.read<QuizResult, QuizResultAttributes>(
        baseWorld,
        QuizResult,
        ["quiz_attempt_id", "quiz_question_id", "quiz_answer_id"]
    );
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
