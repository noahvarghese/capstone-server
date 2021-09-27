import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import ModelActions from "../../../test/helpers/model/actions";
import ModelTestPass from "../../../test/helpers/model/test/pass";
import ModelTestFail from "../../../test/helpers/model/test/fail";
import Quiz, { QuizAttributes } from "./quiz";
import {
    createModels,
    loadAttributes,
} from "../../../test/helpers/model/test/setup";
import { teardown } from "../../../test/helpers/model/test/teardown";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, Quiz);
    await createModels(baseWorld, Quiz);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await teardown(baseWorld, Quiz);
    baseWorld = undefined;
});

// Tests
test("Create Quiz", async () => {
    await ModelTestPass.create<Quiz, QuizAttributes>(baseWorld, Quiz);
});

test("Update Quiz", async () => {
    await ModelTestPass.update<Quiz, QuizAttributes>(baseWorld, Quiz, {
        title: "TEST",
    });
});

test("Delete Quiz", async () => {
    await ModelTestPass.delete<Quiz, QuizAttributes>(baseWorld, Quiz, ["id"]);
});

test("Read Quiz", async () => {
    await ModelTestPass.read<Quiz, QuizAttributes>(baseWorld, Quiz, ["id"]);
});

test("Prevent Deletion of Quiz", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    // set prevent delete in environment data
    baseWorld.setCustomProp<QuizAttributes>("quizAttributes", {
        ...baseWorld.getCustomProp<QuizAttributes>("quizAttributes"),
        prevent_delete: true,
    });

    try {
        await ModelTestFail.delete(
            baseWorld,
            Quiz,

            /QuizDeleteError: Cannot delete quiz while delete lock is set/
        );

        await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, {
            prevent_delete: false,
        });

        await ModelActions.delete<Quiz>(baseWorld, Quiz);
    } catch (e) {
        if (e.deleted !== undefined && e.deleted !== false) {
            await ModelActions.delete<Quiz>(baseWorld, Quiz);
        }
    }
});

test.todo("prevent editing of quiz");

// test("Delete Question while Manual is locked doesn't work", async () => {
//     if (!baseWorld) {
//         throw new Error(BaseWorld.errorMessage);
//     }

//     await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, "quiz", {
//         prevent_edit: true,
//     });

//     try {
//         await ModelTestFail.delete<Question, QuestionAttributes>(
//             baseWorld,
//             Question,
//
//             /QuestionDeleteError: Cannot delete a question while the quiz is locked from editing/
//         );

//         await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, "quiz", {
//             prevent_edit: false,
//         });

//         await ModelActions.delete<Question>(baseWorld);
//     } catch (e) {
//         if (e instanceof ModelError) {
//             if (e.deleted !== undefined && e.deleted !== false) {
//                 await ModelActions.delete<Question>(baseWorld);
//             }
//         }
//         throw e;
//     }
// });

// test("Update Question while Quiz is locked doesn't work", async () => {
//     if (!baseWorld) {
//         throw new Error(BaseWorld.errorMessage);
//     }

//     await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, "quiz", {
//         prevent_edit: true,
//     });

//     try {
//         await ModelTestFail.update<Question, QuestionAttributes>(
//             baseWorld,
//             Question,
//
//             { question: "Who am i?" },
//             /QuestionUpdateError: Cannot update a question while the quiz is locked from editing/
//         );
//     } catch (e) {
//         if (
//             /QuestionDeleteError: Cannot delete a question while the quiz is locked from editing/.test(
//                 e.message
//             )
//         ) {
//             await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, "quiz", {
//                 prevent_edit: false,
//             });

//             await ModelActions.delete<Question>(baseWorld);
//         }
//     }
// });
// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
