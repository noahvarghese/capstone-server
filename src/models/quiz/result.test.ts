import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import QuizResult, { QuizResultAttributes } from "./result";
import ModelTestFail from "../../../test/helpers/model/test/fail";
import ModelTestPass from "../../../test/helpers/model/test/pass";
import { teardown } from "../../../test/helpers/model/test/teardown";
import {
    createModels,
    loadAttributes,
} from "../../../test/helpers/model/test/setup";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, QuizResult);
    await createModels(baseWorld, QuizResult);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await teardown(baseWorld, QuizResult);
    baseWorld = undefined;
});

// Tests
test("Create Quiz Result", async () => {
    await ModelTestPass.create<QuizResult, QuizResultAttributes>(
        baseWorld,
        QuizResult
    );
});

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
