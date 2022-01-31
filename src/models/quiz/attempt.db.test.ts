import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import QuizAttempt, { QuizAttemptAttributes } from "./attempt";
import Model from "@test/model/helpers";
import ModelActions from "@test/model/helpers/actions";
import sleep from "@util/sleep";
import Quiz, { QuizAttributes } from "./quiz";

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

test("Cannot change user_id", async () => {
    let model = await ModelActions.create<QuizAttempt, QuizAttemptAttributes>(
        baseWorld,
        QuizAttempt
    );

    const user_id = model.user_id;

    model = await ModelActions.update<QuizAttempt, QuizAttemptAttributes>(
        baseWorld,
        QuizAttempt,
        { user_id: 10 + user_id }
    );

    expect(model.user_id).toBe(user_id);

    await ModelActions.delete<QuizAttempt>(baseWorld, QuizAttempt);
});

test("Cannot change quiz_id", async () => {
    let model = await ModelActions.create<QuizAttempt, QuizAttemptAttributes>(
        baseWorld,
        QuizAttempt
    );

    const quiz_id = model.quiz_id;

    model = await ModelActions.update<QuizAttempt, QuizAttemptAttributes>(
        baseWorld,
        QuizAttempt,
        { quiz_id: 10 + quiz_id }
    );

    expect(model.quiz_id).toBe(quiz_id);

    await ModelActions.delete<QuizAttempt>(baseWorld, QuizAttempt);
});

test("Cannot update multiple times", async () => {
    let model = await ModelActions.create<QuizAttempt, QuizAttemptAttributes>(
        baseWorld,
        QuizAttempt
    );

    await sleep(1000);

    model = await ModelActions.update<QuizAttempt, QuizAttemptAttributes>(
        baseWorld,
        QuizAttempt,
        { quiz_id: model.quiz_id }
    );

    const firstUpdate = model.updated_on;

    let errorThrown = false;

    try {
        await sleep(1000);
        model = await ModelActions.update<QuizAttempt, QuizAttemptAttributes>(
            baseWorld,
            QuizAttempt,
            { quiz_id: model.quiz_id }
        );
    } catch (e) {
        errorThrown = true;
        expect((e as Partial<{ message?: string }>).message).toMatch(
            /QuizAttemptUpdateError: quiz_attempt_id \d has been completed/
        );
        await ModelActions.delete<QuizAttempt>(baseWorld, QuizAttempt);
    }

    expect(model.updated_on).toEqual(firstUpdate);
    expect(errorThrown).toBe(true);
});

test("User cannot exceed quiz.max_attempts", async () => {
    await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, {
        max_attempts: 1,
    });

    await ModelActions.create<QuizAttempt, QuizAttemptAttributes>(
        baseWorld,
        QuizAttempt
    );

    let errorThrown = false;

    try {
        await ModelActions.create<QuizAttempt, QuizAttemptAttributes>(
            baseWorld,
            QuizAttempt
        );
    } catch (e) {
        errorThrown = true;
        await ModelActions.delete(baseWorld, QuizAttempt);
    }

    expect(errorThrown).toBe(true);
});
