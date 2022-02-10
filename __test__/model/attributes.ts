import { BusinessAttributes, EmptyBusinessAttributes } from "@models/business";
import {
    EmptyMembershipAttributes,
    MembershipAttributes,
} from "@models/membership";
import {
    DepartmentAttributes,
    EmptyDeparmentAttributes,
} from "@models/department";
import {
    ContentAttributes,
    EmptyContentAttributes,
} from "@models/manual/content/content";
import { EmptyManualAttributes, ManualAttributes } from "@models/manual/manual";
import {
    EmptyManualAssignmentAttributes,
    ManualAssignmentAttributes,
} from "@models/manual/assignment";
import { EmptyPolicyAttributes, PolicyAttributes } from "@models/manual/policy";
import {
    EmptyContentReadAttributes,
    ContentReadAttributes,
} from "@models/manual/content/read";
import {
    EmptyManualSectionAttributes,
    ManualSectionAttributes,
} from "@models/manual/section";
import {
    EmptyQuizSectionAttributes,
    QuizSectionAttributes,
} from "@models/quiz/section";
import {
    EmptyQuestionAttributes,
    QuizQuestionAttributes,
} from "@models/quiz/question/question";
import { EmptyQuizAttributes, QuizAttributes } from "@models/quiz/quiz";
import { EmptyRoleAttributes, RoleAttributes } from "@models/role";
import { EmptyUserAttributes, UserAttributes } from "@models/user/user";
import {
    EmptyUserRoleAttributes,
    UserRoleAttributes,
} from "@models/user/user_role";
import {
    EmptyAnswerAttributes,
    QuizAnswerAttributes,
} from "@models/quiz/question/answer";
import {
    EmptyAttemptAttributes,
    QuizAttemptAttributes,
} from "@models/quiz/attempt";
import {
    EmptyResultAttributes,
    QuizResultAttributes,
} from "@models/quiz/question/result";
import { EmptyEventAttributes, EventAttributes } from "@models/event";
import { AttributeFactory } from "@models/abstract/base_model";
import {
    EmptyQuizQuestionTypeAttributes,
    QuizQuestionTypeAttributes,
} from "@models/quiz/question/question_type";

// Configuration
export const businessAttributes = (): BusinessAttributes =>
    AttributeFactory(
        {
            name: "Oakville Windows and Doors",
            address: "1380 Speers Rd",
            city: "Oakville",
            province: "ON",
            country: "CA",
            postal_code: "L6H1X1",
        },
        EmptyBusinessAttributes
    );

export const membershipAttributes = (): MembershipAttributes =>
    AttributeFactory(
        {
            accepted: false,
            user_id: NaN,
            business_id: NaN,
            updated_by_user_id: NaN,
        },
        EmptyMembershipAttributes
    );

export const userAttributes = (): UserAttributes =>
    AttributeFactory(
        {
            first_name: "Noah",
            last_name: "Varghese",
            email: process.env.TEST_EMAIL_1 ?? "",
            phone: "9053393294",
            birthday: new Date("1996-08-07"),
            password: "password",
        },
        EmptyUserAttributes
    );

export const departmentAttributes = (): DepartmentAttributes =>
    AttributeFactory(
        {
            name: "Management",
            prevent_delete: false,
            prevent_edit: false,
            business_id: 1,
            updated_by_user_id: NaN,
        },
        EmptyDeparmentAttributes
    );

export const roleAttributes = (): RoleAttributes =>
    AttributeFactory(
        {
            name: "General",
            prevent_delete: false,
            prevent_edit: false,
            department_id: NaN,
            access: "USER",
            updated_by_user_id: NaN,
        },
        EmptyRoleAttributes
    );

export const userRoleAttributes = (): UserRoleAttributes =>
    AttributeFactory(
        {
            user_id: NaN,
            role_id: NaN,
            updated_by_user_id: NaN,
        },
        EmptyUserRoleAttributes
    );

export const manualAttributes = (): ManualAttributes =>
    AttributeFactory(
        {
            title: "Manual",
            prevent_edit: false,
            prevent_delete: false,
            updated_by_user_id: NaN,
        },
        EmptyManualAttributes
    );

export const manualAssignmentAttributes = (): ManualAssignmentAttributes =>
    AttributeFactory(
        {
            manual_id: NaN,
            role_id: NaN,
            updated_by_user_id: NaN,
        },
        EmptyManualAssignmentAttributes
    );

export const manualSectionAttributes = (): ManualSectionAttributes =>
    AttributeFactory(
        {
            title: "Section",
            manual_id: NaN,
            updated_by_user_id: NaN,
        },
        EmptyManualSectionAttributes
    );

export const policyAttributes = (): PolicyAttributes =>
    AttributeFactory(
        {
            title: "Policy",
            manual_section_id: NaN,
            updated_by_user_id: NaN,
        },
        EmptyPolicyAttributes
    );

export const contentAttributes = (): ContentAttributes =>
    AttributeFactory(
        {
            title: "Content",
            content: "Here are some words",
            policy_id: NaN,
            updated_by_user_id: NaN,
        },
        EmptyContentAttributes
    );

export const contentReadAttributes = (): ContentReadAttributes =>
    AttributeFactory(
        {
            content_id: NaN,
            user_id: NaN,
        },
        EmptyContentReadAttributes
    );

export const quizAttributes = (): QuizAttributes =>
    AttributeFactory(
        {
            title: "Quiz",
            max_attempts: 5,
            manual_id: NaN,
            prevent_edit: false,
            prevent_delete: false,
            updated_by_user_id: NaN,
        },
        EmptyQuizAttributes
    );

export const quizSectionAttributes = (): QuizSectionAttributes =>
    AttributeFactory(
        {
            title: "Section",
            updated_by_user_id: NaN,
            quiz_id: NaN,
        },
        EmptyQuizSectionAttributes
    );

export const quizQuestionAttributes = (): QuizQuestionAttributes =>
    AttributeFactory(
        {
            question: "Question",
            quiz_question_type_id: NaN,
            quiz_section_id: NaN,
            updated_by_user_id: NaN,
        },
        EmptyQuestionAttributes
    );

export const quizQuestionTypeAttributes = (): QuizQuestionTypeAttributes =>
    AttributeFactory(
        {
            question_type: "multiple choice",
            html_attributes: '{"type": "checkbox"}',
            html_tag: "inpute",
        },
        EmptyQuizQuestionTypeAttributes
    );

export const quizAnswerAttributes = (): QuizAnswerAttributes =>
    AttributeFactory(
        {
            answer: "Answer",
            correct: false,
            quiz_question_id: NaN,
            updated_by_user_id: NaN,
        },
        EmptyAnswerAttributes
    );

export const quizAttemptAttributes = (): QuizAttemptAttributes =>
    AttributeFactory(
        {
            quiz_id: NaN,
            user_id: NaN,
        },
        EmptyAttemptAttributes
    );

export const resultAttributes = (): QuizResultAttributes =>
    AttributeFactory(
        {
            quiz_answer_id: NaN,
            quiz_attempt_id: NaN,
            quiz_question_id: NaN,
            updated_by_user_id: NaN,
        },
        EmptyResultAttributes
    );

export const eventAttributes = (): EventAttributes =>
    AttributeFactory(
        {
            name: "Event",
            reason: "YOLO",
            status: "FAIL",
            user_id: null,
            business_id: null,
        },
        EmptyEventAttributes
    );

export default {
    business: businessAttributes,
    membership: membershipAttributes,
    user: userAttributes,
    department: departmentAttributes,
    role: roleAttributes,
    userRole: userRoleAttributes,
    manual: manualAttributes,
    manualAssignment: manualAssignmentAttributes,
    manualSection: manualSectionAttributes,
    policy: policyAttributes,
    content: contentAttributes,
    contentRead: contentReadAttributes,
    quiz: quizAttributes,
    quizSection: quizSectionAttributes,
    quizQuestion: quizQuestionAttributes,
    quizQuestionType: quizQuestionTypeAttributes,
    quizAnswer: quizAnswerAttributes,
    quizResult: resultAttributes,
    event: eventAttributes,
    quizAttempt: quizAttemptAttributes,
};
