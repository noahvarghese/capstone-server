import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import QuizResult, { QuizResultAttributes } from "./result";
import ModelTestFail from "@test/model/helpers/test/fail";
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
    await Model.setup.call(baseWorld, QuizResult);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, QuizResult);
    baseWorld.resetProps();
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

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
