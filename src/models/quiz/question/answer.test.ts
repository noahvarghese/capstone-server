import BaseWorld from "../../../../test/jest/support/base_world";
import DBConnection from "../../../../test/util/db_connection";
import ModelActions from "../../../../test/helpers/model/actions";
import ModelTestPass from "../../../../test/helpers/model/test/pass";
import ModelTestFail from "../../../../test/helpers/model/test/fail";
import ModelError from "../../../../test/util/model_error";
import Quiz, { QuizAttributes } from "../quiz";
import QuizAnswer, { QuizAnswerAttributes } from "./answer";
import QuizQuestion from "./question";
import {
    createModels,
    loadAttributes,
} from "../../../../test/helpers/model/test/setup";
import { teardown } from "../../../../test/helpers/model/test/teardown";
import ModelTestParentPrevent from "../../../../test/helpers/model/test/parent_prevent";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, QuizAnswer);
    await createModels(baseWorld, QuizAnswer);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await teardown(baseWorld, QuizAnswer);
    baseWorld = undefined;
});

// Tests
test("Create Quiz QuizAnswer", async () => {
    await ModelTestPass.create<QuizAnswer, QuizAnswerAttributes>(
        baseWorld,
        QuizAnswer
    );
});

test("Update Quiz QuizAnswer", async () => {
    await ModelTestPass.update<QuizAnswer, QuizAnswerAttributes>(
        baseWorld,
        QuizAnswer,
        {
            answer: "TEST",
        }
    );
});

test("Delete Quiz QuizAnswer", async () => {
    await ModelTestPass.delete<QuizAnswer, QuizAnswerAttributes>(
        baseWorld,
        QuizAnswer,
        ["id"]
    );
});

test("Read Quiz QuizAnswer", async () => {
    await ModelTestPass.read<QuizAnswer, QuizAnswerAttributes>(
        baseWorld,
        QuizAnswer,
        ["id"]
    );
});

test("Delete QuizAnswer while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, {
        prevent_edit: true,
    });

    try {
        await ModelTestFail.delete<QuizAnswer, QuizAnswerAttributes>(
            baseWorld,
            QuizAnswer,

            /QuizAnswerDeleteError: Cannot delete an answer while the quiz is locked from editing/
        );

        await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, {
            prevent_edit: false,
        });

        await ModelActions.delete<QuizAnswer>(baseWorld, QuizAnswer);
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
// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
