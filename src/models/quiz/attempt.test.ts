import BaseWorld from "../../../test/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import ModelTestPass from "../../../test/jest/helpers/model/test/pass";
import ModelTestFail from "../../../test/jest/helpers/model/test/fail";
import QuizAttempt, { QuizAttemptAttributes } from "./attempt";
import { teardown } from "../../../test/jest/helpers/model/test/teardown";
import {
    createModels,
    loadAttributes,
} from "../../../test/jest/helpers/model/test/setup";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, QuizAttempt);
    await createModels(baseWorld, QuizAttempt);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await teardown(baseWorld, QuizAttempt);
    baseWorld = undefined;
});

// Tests
test("Create Quiz Attempt", async () => {
    await ModelTestPass.create<QuizAttempt, QuizAttemptAttributes>(
        baseWorld,
        QuizAttempt
    );
});

test("Delete Quiz Attempt", async () => {
    await ModelTestPass.delete<QuizAttempt, QuizAttemptAttributes>(
        baseWorld,
        QuizAttempt,
        ["user_id", "quiz_id"]
    );
});

test("Read Quiz Attempt", async () => {
    await ModelTestPass.read<QuizAttempt, QuizAttemptAttributes>(
        baseWorld,
        QuizAttempt,
        ["user_id", "quiz_id"]
    );
});

test("Update quiz attempt should fail", async () => {
    await ModelTestFail.update<QuizAttempt, QuizAttemptAttributes>(
        baseWorld,
        QuizAttempt,
        { user_id: -1 },
        /QuizAttemptUpdateError: Cannot update quiz_attempt/
    );
});
