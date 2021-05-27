/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    answerAttributes,
    attemptAttributes,
    businessAttributes,
    departmentAttributes,
    manualAttributes,
    permissionAttributes,
    questionAttributes,
    quizAttributes,
    quizSectionAttributes,
    resultAttributes,
    roleAttributes,
    userAttributes,
} from "../../../test/sample_data.ts/attributes";
import BaseWorld from "../../../test/util/store";
import DBConnection from "../../../test/util/db_connection";
import { createModel, deleteModel } from "../../../test/util/model_actions";
import {
    testCreateModel,
    testDeleteModel,
    testReadModel,
} from "../../../test/util/model_compare";
import Business, { BusinessAttributes } from "../business";
import Department, { DepartmentAttributes } from "../department";
import Permission, { PermissionAttributes } from "../permission";
import Role, { RoleAttributes } from "../role";
import User, { UserAttributes } from "../user/user";
import Manual, { ManualAttributes } from "../manual/manual";
import Quiz, { QuizAttributes } from "./quiz";
import Section, { SectionAttributes } from "./section";
import Question, { QuestionAttributes } from "./question";
import Answer, { AnswerAttributes } from "./answer";
import Result, { ResultAttributes } from "./result";
import Attempt, { AttemptAttributes } from "./attempt";

let baseWorld: BaseWorld | undefined;
const key = "result";
const attrKey = `${key}Attributes`;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    baseWorld.setCustomProp<BusinessAttributes>(
        "businessAttributes",
        businessAttributes
    );
    baseWorld.setCustomProp<UserAttributes>("userAttributes", userAttributes);
    baseWorld.setCustomProp<PermissionAttributes>(
        "permissionAttributes",
        permissionAttributes
    );
    baseWorld.setCustomProp<DepartmentAttributes>(
        "departmentAttributes",
        departmentAttributes
    );
    baseWorld.setCustomProp<RoleAttributes>("roleAttributes", roleAttributes);
    baseWorld.setCustomProp<ManualAttributes>(
        "manualAttributes",
        manualAttributes
    );
    baseWorld.setCustomProp<QuizAttributes>("quizAttributes", quizAttributes);
    baseWorld.setCustomProp<SectionAttributes>(
        "quizSectionAttributes",
        quizSectionAttributes
    );
    baseWorld.setCustomProp<QuestionAttributes>(
        "questionAttributes",
        questionAttributes
    );
    baseWorld.setCustomProp<AnswerAttributes>(
        "answerAttributes",
        answerAttributes
    );
    baseWorld.setCustomProp<AttemptAttributes>(
        "attemptAttributes",
        attemptAttributes
    );
    baseWorld.setCustomProp<ResultAttributes>(attrKey, resultAttributes);
});
afterEach(() => {
    baseWorld = undefined;
});

// Domain setup
beforeEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const business = await createModel<Business, BusinessAttributes>(
        baseWorld,
        Business,
        "business"
    );

    baseWorld.setCustomProp<UserAttributes>("userAttributes", {
        ...baseWorld.getCustomProp<UserAttributes>("userAttributes"),
        business_id: business.id,
    });

    const user = await createModel<User, UserAttributes>(
        baseWorld,
        User,
        "user"
    );

    baseWorld.setCustomProp<DepartmentAttributes>("departmentAttributes", {
        ...baseWorld.getCustomProp<DepartmentAttributes>(
            "departmentAttributes"
        ),
        business_id: business.id,
        updated_by_user_id: user.id,
    });

    const department = await createModel<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        "department"
    );

    baseWorld.setCustomProp<PermissionAttributes>("permissionAttributes", {
        ...baseWorld.getCustomProp<PermissionAttributes>(
            "permissionAttributes"
        ),
        updated_by_user_id: user.id,
    });

    const permission = await createModel<Permission, PermissionAttributes>(
        baseWorld,
        Permission,
        "permission"
    );

    baseWorld.setCustomProp<RoleAttributes>("roleAttributes", {
        ...baseWorld.getCustomProp<RoleAttributes>("roleAttributes"),
        updated_by_user_id: user.id,
        permission_id: permission.id,
        department_id: department.id,
    });

    const role = await createModel<Role, RoleAttributes>(
        baseWorld,
        Role,
        "role"
    );

    baseWorld.setCustomProp<ManualAttributes>("manualAttributes", {
        ...baseWorld.getCustomProp<ManualAttributes>("manualAttributes"),
        department_id: department.id,
        role_id: role.id,
        updated_by_user_id: user.id,
    });

    const manual = await createModel<Manual, ManualAttributes>(
        baseWorld,
        Manual,
        "manual"
    );

    baseWorld.setCustomProp<QuizAttributes>("quizAttributes", {
        ...baseWorld.getCustomProp<QuizAttributes>("quizAttributes"),
        manual_id: manual.id,
        updated_by_user_id: user.id,
    });

    const quiz = await createModel<Quiz, QuizAttributes>(
        baseWorld,
        Quiz,
        "quiz"
    );

    baseWorld.setCustomProp<SectionAttributes>("quizSectionAttributes", {
        ...baseWorld.getCustomProp<SectionAttributes>("quizSectionAttributes"),
        quiz_id: quiz.id,
        updated_by_user_id: user.id,
    });

    const quizSection = await createModel<Section, SectionAttributes>(
        baseWorld,
        Section,
        "quizSection"
    );

    baseWorld.setCustomProp<QuestionAttributes>("questionAttributes", {
        ...baseWorld.getCustomProp<QuestionAttributes>("questionAttributes"),
        quiz_section_id: quizSection.id,
        updated_by_user_id: user.id,
    });

    const question = await createModel<Question, QuestionAttributes>(
        baseWorld,
        Question,
        "question"
    );

    baseWorld.setCustomProp<AnswerAttributes>("answerAttributes", {
        ...baseWorld.getCustomProp<AnswerAttributes>("answerAttributes"),
        quiz_question_id: question.id,
        updated_by_user_id: user.id,
    });

    const answer = await createModel<Answer, AnswerAttributes>(
        baseWorld,
        Answer,
        "answer"
    );

    baseWorld.setCustomProp<AttemptAttributes>("attemptAttributes", {
        ...baseWorld.getCustomProp<AttemptAttributes>("attemptAttributes"),
        quiz_id: quiz.id,
        user_id: user.id,
    });

    const attempt = await createModel<Attempt, AttemptAttributes>(
        baseWorld,
        Attempt,
        "attempt"
    );

    baseWorld.setCustomProp<ResultAttributes>(attrKey, {
        ...baseWorld.getCustomProp<ResultAttributes>(attrKey),
        quiz_answer_id: answer.id,
        quiz_attempt_id: attempt.id,
        quiz_question_id: question.id,
    });
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await deleteModel<Attempt>(baseWorld, Attempt, "attempt");
    await deleteModel<Answer>(baseWorld, Answer, "answer");
    await deleteModel<Question>(baseWorld, Question, "question");
    await deleteModel<Section>(baseWorld, Section, "quizSection");
    await deleteModel<Quiz>(baseWorld, Quiz, "quiz");
    await deleteModel<Manual>(baseWorld, Manual, "manual");
    await deleteModel<Role>(baseWorld, Role, "role");
    await deleteModel<Permission>(baseWorld, Permission, "permission");
    await deleteModel<Department>(baseWorld, Department, "department");
    await deleteModel<User>(baseWorld, User, "user");
    await deleteModel<Business>(baseWorld, Business, "business");
});

// Tests
test("Create Quiz Result", async () => {
    await testCreateModel<Result, ResultAttributes>(baseWorld, Result, key);
});

// test("Update Quiz Answer", async () => {
//     await testUpdateModel<Answer, AnswerAttributes>(
//         baseWorld,
//         Answer,
//         key,
//         "answer",
//         "TEST"
//     );
// });

test("Delete Quiz Result", async () => {
    await testDeleteModel<Result, ResultAttributes>(baseWorld, Result, key, [
        "quiz_attempt_id",
        "quiz_question_id",
        "quiz_answer_id",
    ]);
});

test("Read Quiz Result", async () => {
    await testReadModel<Result, ResultAttributes>(baseWorld, Result, key, [
        "quiz_attempt_id",
        "quiz_question_id",
        "quiz_answer_id",
    ]);
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
