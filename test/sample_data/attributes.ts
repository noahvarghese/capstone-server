import {
    BusinessAttributes,
    EmptyBusinessAttributes,
} from "../../src/models/business";
import {
    EmptyMembershipAttributes,
    MembershipAttributes,
} from "../../src/models/membership";
import {
    DepartmentAttributes,
    EmptyDeparmentAttributes,
} from "../../src/models/department";
import {
    ContentAttributes,
    EmptyContentAttributes,
} from "../../src/models/manual/content";
import {
    EmptyManualAttributes,
    ManualAttributes,
} from "../../src/models/manual/manual";
import {
    EmptyManualAssignmentAttributes,
    ManualAssignmentAttributes,
} from "../../src/models/manual/assignment";
import {
    EmptyPolicyAttributes,
    PolicyAttributes,
} from "../../src/models/manual/policy/policy";
import {
    EmptyPolicyReadAttributes,
    PolicyReadAttributes,
} from "../../src/models/manual/policy/read";
import {
    EmptyManualSectionAttributes,
    ManualSectionAttributes,
} from "../../src/models/manual/section";
import {
    EmptyQuizSectionAttributes,
    QuizSectionAttributes,
} from "../../src/models/quiz/section";
import {
    EmptyPermissionAttributes,
    PermissionAttributes,
} from "../../src/models/permission";
import {
    EmptyQuestionAttributes,
    QuizQuestionAttributes,
} from "../../src/models/quiz/question/question";
import {
    EmptyQuizAttributes,
    QuizAttributes,
} from "../../src/models/quiz/quiz";
import { EmptyRoleAttributes, RoleAttributes } from "../../src/models/role";
import {
    EmptyUserAttributes,
    UserAttributes,
} from "../../src/models/user/user";
import {
    EmptyUserRoleAttributes,
    UserRoleAttributes,
} from "../../src/models/user/user_role";
import {
    EmptyAnswerAttributes,
    QuizAnswerAttributes,
} from "../../src/models/quiz/question/answer";
import {
    EmptyAttemptAttributes,
    QuizAttemptAttributes,
} from "../../src/models/quiz/attempt";
import {
    EmptyResultAttributes,
    QuizResultAttributes,
} from "../../src/models/quiz/result";
import { EmptyEventAttributes, EventAttributes } from "../../src/models/event";
import { AttributeFactory } from "../../src/models/abstract/base_model";
import {
    EmptyMembershipRequestAttributes,
    MembershipRequestAttributes,
} from "../../src/models/membership_request";

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
        },
        EmptyMembershipAttributes
    );

export const membershipRequestAttributes = (): MembershipRequestAttributes =>
    AttributeFactory(
        {
            business_id: -1,
            token: "",
            user_id: -1,
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
            add_users: true,
            delete_users: true,
            edit_users: true,
            assign_users_to_department: true,
            assign_users_to_role: true,
            create_resources: true,
            assign_resources_to_department: true,
            assign_resources_to_role: true,
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
        },
        EmptyResultAttributes
    );

export const eventAttributes = (): EventAttributes =>
    AttributeFactory(
        {
            name: "Event",
            status: "FAIL",
            user_id: null,
            business_id: null,
        },
        EmptyEventAttributes
    );

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
