import BaseWorld from "../../../../test/jest/support/base_world";
import DBConnection from "../../../../test/util/db_connection";
import ModelActions from "../../../../test/helpers/model/actions";
import ModelTestPass from "../../../../test/helpers/model/test/pass";
import ModelTestFail from "../../../../test/helpers/model/test/fail";
import Quiz, { QuizAttributes } from "../quiz";
import QuizQuestion, { QuizQuestionAttributes } from "./question";
import ModelError from "../../../../test/util/model_error";
import { teardown } from "../../../../test/helpers/model/test/teardown";
import {
    createModels,
    loadAttributes,
} from "../../../../test/helpers/model/test/setup";

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

    await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, {
        prevent_edit: true,
    });

    try {
        await ModelTestFail.delete<QuizQuestion, QuizQuestionAttributes>(
            baseWorld,
            QuizQuestion,
            /QuizQuestionDeleteError: Cannot delete a question while the quiz is locked from editing/
        );

        await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, {
            prevent_edit: false,
        });

        await ModelActions.delete<QuizQuestion>(baseWorld, QuizQuestion);
    } catch (e) {
        if (e instanceof ModelError) {
            if (e.deleted !== undefined && e.deleted !== false) {
                await ModelActions.delete<QuizQuestion>(
                    baseWorld,
                    QuizQuestion
                );
            }
        }
        throw e;
    }
});

test("Update Question while Quiz is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, {
        prevent_edit: true,
    });

    try {
        await ModelTestFail.update<QuizQuestion, QuizQuestionAttributes>(
            baseWorld,
            QuizQuestion,
            { question: "Who am i?" },
            /QuizQuestionUpdateError: Cannot update a question while the quiz is locked from editing/
        );
    } catch (e) {
        if (
            /QuizQuestionDeleteError: Cannot delete a question while the quiz is locked from editing/.test(
                e.message
            )
        ) {
            await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, {
                prevent_edit: false,
            });

            await ModelActions.delete<QuizQuestion>(baseWorld, QuizQuestion);
        }
    }
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
