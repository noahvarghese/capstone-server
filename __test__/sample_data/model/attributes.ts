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
} from "@models/manual/content";
import { EmptyManualAttributes, ManualAttributes } from "@models/manual/manual";
import {
    EmptyManualAssignmentAttributes,
    ManualAssignmentAttributes,
} from "@models/manual/assignment";
import {
    EmptyPolicyAttributes,
    PolicyAttributes,
} from "@models/manual/policy/policy";
import {
    EmptyPolicyReadAttributes,
    PolicyReadAttributes,
} from "@models/manual/policy/read";
import {
    EmptyManualSectionAttributes,
    ManualSectionAttributes,
} from "@models/manual/section";
import {
    EmptyQuizSectionAttributes,
    QuizSectionAttributes,
} from "@models/quiz/section";
import {
    EmptyPermissionAttributes,
    PermissionAttributes,
} from "@models/permission";
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
} from "@models/quiz/result";
import { EmptyEventAttributes, EventAttributes } from "@models/event";
import { AttributeFactory } from "@models/abstract/base_model";
import {
    EmptyMembershipRequestAttributes,
    MembershipRequestAttributes,
} from "@models/membership_request";

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
            user_id: -1,
            business_id: -1,
            updated_by_user_id: null,
            default: false,
        },
        EmptyMembershipAttributes
    );

export const membershipRequestAttributes = (): MembershipRequestAttributes =>
    AttributeFactory(
        {
            business_id: -1,
            token: "",
            user_id: -1,
            updated_by_user_id: -1,
        },
        EmptyMembershipRequestAttributes
    );

export const userAttributes = (): UserAttributes =>
    AttributeFactory(
        {
            first_name: "Noah",
            last_name: "Varghese",
            email: "varghese.noah@gmail.com",
            phone: "9053393294",
            address: "207 Elderwood Trail",
            city: "Oakville",
            postal_code: "L6H1X1",
            province: "ON",
            country: "CA",
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
            updated_by_user_id: -1,
        },
        EmptyDeparmentAttributes
    );

export const permissionAttributes = (): PermissionAttributes =>
    AttributeFactory(
        {
            global_crud_users: true,
            global_crud_department: true,
            global_crud_role: true,
            global_crud_resources: true,
            global_assign_users_to_department: true,
            global_assign_users_to_role: true,
            global_assign_resources_to_department: true,
            global_assign_resources_to_role: true,
            global_view_reports: true,
            dept_crud_role: true,
            dept_crud_resources: true,
            dept_assign_users_to_role: true,
            dept_assign_resources_to_role: true,
            dept_view_reports: true,
            updated_by_user_id: -1,
        },
        EmptyPermissionAttributes
    );

export const roleAttributes = (): RoleAttributes =>
    AttributeFactory(
        {
            name: "Admin",
            prevent_delete: false,
            prevent_edit: false,
            department_id: -1,
            permission_id: -1,
            updated_by_user_id: -1,
        },
        EmptyRoleAttributes
    );

export const userRoleAttributes = (): UserRoleAttributes =>
    AttributeFactory(
        {
            user_id: -1,
            role_id: -1,
            primary_role_for_user: true,
            updated_by_user_id: -1,
        },
        EmptyUserRoleAttributes
    );

export const manualAttributes = (): ManualAttributes =>
    AttributeFactory(
        {
            title: "Manual",
            role_id: -1,
            department_id: -1,
            prevent_edit: false,
            prevent_delete: false,
            updated_by_user_id: -1,
        },
        EmptyManualAttributes
    );

export const manualAssignmentAttributes = (): ManualAssignmentAttributes =>
    AttributeFactory(
        {
            department_id: -1,
            manual_id: -1,
            role_id: -1,
            updated_by_user_id: -1,
        },
        EmptyManualAssignmentAttributes
    );

export const manualSectionAttributes = (): ManualSectionAttributes =>
    AttributeFactory(
        {
            title: "Section",
            manual_id: -1,
            updated_by_user_id: -1,
        },
        EmptyManualSectionAttributes
    );

export const policyAttributes = (): PolicyAttributes =>
    AttributeFactory(
        {
            title: "Policy",
            manual_section_id: -1,
            updated_by_user_id: -1,
        },
        EmptyPolicyAttributes
    );

export const contentAttributes = (): ContentAttributes =>
    AttributeFactory(
        {
            title: "Content",
            content: "Here are some words",
            policy_id: -1,
            updated_by_user_id: -1,
        },
        EmptyContentAttributes
    );

export const policyReadAttributes = (): PolicyReadAttributes =>
    AttributeFactory(
        {
            policy_id: -1,
            user_id: -1,
        },
        EmptyPolicyReadAttributes
    );

export const quizAttributes = (): QuizAttributes =>
    AttributeFactory(
        {
            title: "Quiz",
            max_attempts: 5,
            manual_id: -1,
            prevent_edit: false,
            prevent_delete: false,
            updated_by_user_id: -1,
        },
        EmptyQuizAttributes
    );

export const quizSectionAttributes = (): QuizSectionAttributes =>
    AttributeFactory(
        {
            title: "Section",
            updated_by_user_id: -1,
            quiz_id: -1,
        },
        EmptyQuizSectionAttributes
    );

export const quizQuestionAttributes = (): QuizQuestionAttributes =>
    AttributeFactory(
        {
            question: "Question",
            type: "radio",
            quiz_section_id: -1,
            updated_by_user_id: -1,
        },
        EmptyQuestionAttributes
    );

export const quizAnswerAttributes = (): QuizAnswerAttributes =>
    AttributeFactory(
        {
            answer: "Answer",
            correct: false,
            quiz_question_id: -1,
            updated_by_user_id: -1,
        },
        EmptyAnswerAttributes
    );

export const quizAttemptAttributes = (): QuizAttemptAttributes =>
    AttributeFactory(
        {
            quiz_id: -1,
            user_id: -1,
        },
        EmptyAttemptAttributes
    );

export const resultAttributes = (): QuizResultAttributes =>
    AttributeFactory(
        {
            quiz_answer_id: -1,
            quiz_attempt_id: -1,
            quiz_question_id: -1,
            updated_by_user_id: -1,
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

export type ModelKey =
    | "business"
    | "membership"
    | "membershipRequest"
    | "user"
    | "permission"
    | "department"
    | "role"
    | "userRole"
    | "manual"
    | "manualAssignment"
    | "manualSection"
    | "policy"
    | "content"
    | "policyRead"
    | "quiz"
    | "quizSection"
    | "quizQuestion"
    | "quizAnswer"
    | "quizResult"
    | "quizAttempt"
    | "event";

export default {
    business: businessAttributes,
    membership: membershipAttributes,
    membershipRequest: membershipRequestAttributes,
    user: userAttributes,
    permission: permissionAttributes,
    department: departmentAttributes,
    role: roleAttributes,
    userRole: userRoleAttributes,
    manual: manualAttributes,
    manualAssignment: manualAssignmentAttributes,
    manualSection: manualSectionAttributes,
    policy: policyAttributes,
    content: contentAttributes,
    policyRead: policyReadAttributes,
    quiz: quizAttributes,
    quizSection: quizSectionAttributes,
    quizQuestion: quizQuestionAttributes,
    quizAnswer: quizAnswerAttributes,
    quizResult: resultAttributes,
    event: eventAttributes,
    quizAttempt: quizAttemptAttributes,
};
