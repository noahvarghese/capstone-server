/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    answerAttributes,
    businessAttributes,
    departmentAttributes,
    manualAttributes,
    permissionAttributes,
    questionAttributes,
    quizAttributes,
    quizSectionAttributes,
    roleAttributes,
    userAttributes,
} from "../../../test/util/attributes";
import BaseWorld from "../../../test/util/store";
import DBConnection from "../../../test/util/db_connection";
import { createModel, deleteModel } from "../../../test/util/model_actions";
import {
    testCreateModel,
    testDeleteModel,
    testReadModel,
    testUpdateModel,
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

let baseWorld: BaseWorld | undefined;
const key = "answer";
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
    baseWorld.setCustomProp<AnswerAttributes>(attrKey, answerAttributes);
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

    baseWorld.setCustomProp<AnswerAttributes>(attrKey, {
        ...baseWorld.getCustomProp<AnswerAttributes>(attrKey),
        quiz_question_id: question.id,
        updated_by_user_id: user.id,
    });
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

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
test("Create Quiz Answer", async () => {
    await testCreateModel<Answer, AnswerAttributes>(baseWorld, Answer, key);
});

test("Update Quiz Answer", async () => {
    await testUpdateModel<Answer, AnswerAttributes>(
        baseWorld,
        Answer,
        key,
        "answer",
        "TEST"
    );
});

test("Delete Quiz Answer", async () => {
    await testDeleteModel<Answer, AnswerAttributes>(baseWorld, Answer, key, [
        "id",
    ]);
});

test("Read Quiz Answer", async () => {
    await testReadModel<Answer, AnswerAttributes>(baseWorld, Answer, key, [
        "id",
    ]);
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
