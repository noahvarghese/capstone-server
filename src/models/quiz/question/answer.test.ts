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
} from "../../../../test/sample_data/attributes";
import BaseWorld from "../../../../test/jest/support/base_world";
import DBConnection from "../../../../test/util/db_connection";
import ModelActions from "../../../../test/helpers/model/actions";
import ModelTestPass from "../../../../test/helpers/model/test/pass";
import ModelTestFail from "../../../../test/helpers/model/test/fail";
import ModelError from "../../../../test/util/model_error";
import Business, { BusinessAttributes } from "../../business";
import Department, { DepartmentAttributes } from "../../department";
import Permission, { PermissionAttributes } from "../../permission";
import Role, { RoleAttributes } from "../../role";
import User, { UserAttributes } from "../../user/user";
import Manual, { ManualAttributes } from "../../manual/manual";
import Quiz, { QuizAttributes } from "../quiz";
import Section, { SectionAttributes } from "../section";
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

    const business = await ModelActions.create<Business, BusinessAttributes>(
        baseWorld,
        Business,
        "business"
    );

    baseWorld.setCustomProp<UserAttributes>("userAttributes", {
        ...baseWorld.getCustomProp<UserAttributes>("userAttributes"),
        business_id: business.id,
    });

    const user = await ModelActions.create<User, UserAttributes>(
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

    const department = await ModelActions.create<
        Department,
        DepartmentAttributes
    >(baseWorld, Department, "department");

    baseWorld.setCustomProp<PermissionAttributes>("permissionAttributes", {
        ...baseWorld.getCustomProp<PermissionAttributes>(
            "permissionAttributes"
        ),
        updated_by_user_id: user.id,
    });

    const permission = await ModelActions.create<
        Permission,
        PermissionAttributes
    >(baseWorld, Permission, "permission");

    baseWorld.setCustomProp<RoleAttributes>("roleAttributes", {
        ...baseWorld.getCustomProp<RoleAttributes>("roleAttributes"),
        updated_by_user_id: user.id,
        permission_id: permission.id,
        department_id: department.id,
    });

    const role = await ModelActions.create<Role, RoleAttributes>(
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

    const manual = await ModelActions.create<Manual, ManualAttributes>(
        baseWorld,
        Manual,
        "manual"
    );

    baseWorld.setCustomProp<QuizAttributes>("quizAttributes", {
        ...baseWorld.getCustomProp<QuizAttributes>("quizAttributes"),
        manual_id: manual.id,
        updated_by_user_id: user.id,
    });

    const quiz = await ModelActions.create<Quiz, QuizAttributes>(
        baseWorld,
        Quiz,
        "quiz"
    );

    baseWorld.setCustomProp<SectionAttributes>("quizSectionAttributes", {
        ...baseWorld.getCustomProp<SectionAttributes>("quizSectionAttributes"),
        quiz_id: quiz.id,
        updated_by_user_id: user.id,
    });

    const quizSection = await ModelActions.create<Section, SectionAttributes>(
        baseWorld,
        Section,
        "quizSection"
    );

    baseWorld.setCustomProp<QuestionAttributes>("questionAttributes", {
        ...baseWorld.getCustomProp<QuestionAttributes>("questionAttributes"),
        quiz_section_id: quizSection.id,
        updated_by_user_id: user.id,
    });

    const question = await ModelActions.create<Question, QuestionAttributes>(
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

    await ModelActions.delete<Question>(baseWorld, "question");
    await ModelActions.delete<Section>(baseWorld, "quizSection");
    await ModelActions.delete<Quiz>(baseWorld, "quiz");
    await ModelActions.delete<Manual>(baseWorld, "manual");
    await ModelActions.delete<Role>(baseWorld, "role");
    await ModelActions.delete<Permission>(baseWorld, "permission");
    await ModelActions.delete<Department>(baseWorld, "department");
    await ModelActions.delete<User>(baseWorld, "user");
    await ModelActions.delete<Business>(baseWorld, "business");
});

// Tests
test("Create Quiz Answer", async () => {
    await ModelTestPass.create<Answer, AnswerAttributes>(
        baseWorld,
        Answer,
        key
    );
});

test("Update Quiz Answer", async () => {
    await ModelTestPass.update<Answer, AnswerAttributes>(
        baseWorld,
        Answer,
        key,
        {
            answer: "TEST",
        }
    );
});

test("Delete Quiz Answer", async () => {
    await ModelTestPass.delete<Answer, AnswerAttributes>(
        baseWorld,
        Answer,
        key,
        ["id"]
    );
});

test("Read Quiz Answer", async () => {
    await ModelTestPass.read<Answer, AnswerAttributes>(baseWorld, Answer, key, [
        "id",
    ]);
});

test("Delete Answer while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, "quiz", {
        prevent_edit: true,
    });

    try {
        await ModelTestFail.delete<Answer, AnswerAttributes>(
            baseWorld,
            Answer,
            key,
            /AnswerDeleteError: Cannot delete an answer while the quiz is locked from editing/
        );

        await ModelActions.update<Quiz, QuizAttributes>(
            baseWorld,
            Quiz,
            "quiz",
            {
                prevent_edit: false,
            }
        );

        await ModelActions.delete<Answer>(baseWorld, key);
    } catch (e) {
        if (e instanceof ModelError) {
            if (e.deleted !== undefined && e.deleted !== false) {
                await ModelActions.delete<Question>(baseWorld, key);
            }
        }
        throw e;
    }
});

test("Update Answer while Quiz is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, "quiz", {
        prevent_edit: true,
    });

    try {
        await ModelTestFail.update<Answer, AnswerAttributes>(
            baseWorld,
            Answer,
            key,
            { answer: "Me" },
            /AnswerUpdateError: Cannot update an answer while the quiz is locked from editing/
        );
    } catch (e) {
        if (
            /AnswerDeleteError: Cannot delete an answer while the quiz is locked from editing/.test(
                e.message
            )
        ) {
            await ModelActions.update<Quiz, QuizAttributes>(
                baseWorld,
                Quiz,
                "quiz",
                {
                    prevent_edit: false,
                }
            );

            await ModelActions.delete<Question>(baseWorld, key);
        }
    }
});
// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
