import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import ModelTestFail from "@test/model/helpers/test/fail";
import QuizAttempt, { QuizAttemptAttributes } from "./attempt";
import Model from "@test/model/helpers";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, QuizAttempt);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, QuizAttempt);
    baseWorld.resetProps();
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
