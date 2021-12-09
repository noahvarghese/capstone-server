import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestFail from "@test/model/helpers/test/fail";
import QuizAttempt, { QuizAttemptAttributes } from "./attempt";
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
    await Model.setup.call(baseWorld, QuizAttempt);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, QuizAttempt);
    baseWorld.resetProps();
});

test("Update quiz attempt should fail", async () => {
    await ModelTestFail.update<QuizAttempt, QuizAttemptAttributes>(
        baseWorld,
        QuizAttempt,
        { user_id: -1 },
        /QuizAttemptUpdateError: Cannot update quiz_attempt/
    );
});
