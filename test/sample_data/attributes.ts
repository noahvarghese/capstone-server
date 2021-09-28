import { BusinessAttributes } from "../../src/models/business";
import { MembershipAttributes } from "../../src/models/membership";
import { DepartmentAttributes } from "../../src/models/department";
import { ContentAttributes } from "../../src/models/manual/content";
import { ManualAttributes } from "../../src/models/manual/manual";
import { ManualAssignmentAttributes } from "../../src/models/manual/assignment";
import { PolicyAttributes } from "../../src/models/manual/policy/policy";
import { PolicyReadAttributes } from "../../src/models/manual/policy/read";
import { ManualSectionAttributes } from "../../src/models/manual/section";
import { QuizSectionAttributes } from "../../src/models/quiz/section";
import { PermissionAttributes } from "../../src/models/permission";
import { QuizQuestionAttributes } from "../../src/models/quiz/question/question";
import { QuizAttributes } from "../../src/models/quiz/quiz";
import { RoleAttributes } from "../../src/models/role";
import { UserAttributes } from "../../src/models/user/user";
import { UserRoleAttributes } from "../../src/models/user/user_role";
import { QuizAnswerAttributes } from "../../src/models/quiz/question/answer";
import { QuizAttemptAttributes } from "../../src/models/quiz/attempt";
import { QuizResultAttributes } from "../../src/models/quiz/result";
import { EventAttributes } from "../../src/models/event";

// Configuration
export const businessAttributes: BusinessAttributes = {
    name: "Oakville Windows and Doors",
    address: "1380 Speers Rd",
    city: "Oakville",
    province: "ON",
    country: "CA",
    postal_code: "L6H1X1",
};

export const membershipAttributes: MembershipAttributes = {
    user_id: -1,
    business_id: -1,
    deactivated: false,
};

export const userAttributes: UserAttributes = {
    first_name: "Noah",
    last_name: "Varghese",
    email: "varghese.noah@gmail.com",
    password: "password",
    phone: "9053393294",
};

export const departmentAttributes: DepartmentAttributes = {
    name: "Management",
    prevent_delete: false,
    business_id: 1,
    updated_by_user_id: -1,
};

export const permissionAttributes: PermissionAttributes = {
    add_users_to_business: true,
    assign_users_to_department: true,
    assign_users_to_role: true,
    create_resources: true,
    assign_resources_to_department: true,
    assign_resources_to_role: true,
    updated_by_user_id: -1,
};

export const roleAttributes: RoleAttributes = {
    name: "Admin",
    prevent_delete: false,
    department_id: -1,
    permission_id: -1,
    updated_by_user_id: -1,
};

export const userRoleAttributes: UserRoleAttributes = {
    user_id: -1,
    role_id: -1,
    updated_by_user_id: -1,
};

export const manualAttributes: ManualAttributes = {
    title: "Manual",
    role_id: -1,
    department_id: -1,
    prevent_edit: false,
    prevent_delete: false,
    updated_by_user_id: -1,
};

export const manualAssignmentAttributes: ManualAssignmentAttributes = {
    department_id: -1,
    manual_id: -1,
    role_id: -1,
    updated_by_user_id: -1,
};

export const manualSectionAttributes: ManualSectionAttributes = {
    title: "Section",
    manual_id: -1,
    updated_by_user_id: -1,
};

export const policyAttributes: PolicyAttributes = {
    title: "Policy",
    manual_section_id: -1,
    updated_by_user_id: -1,
};

export const contentAttributes: ContentAttributes = {
    title: "Content",
    content: "Here are some words",
    policy_id: -1,
    updated_by_user_id: -1,
};

export const policyReadAttributes: PolicyReadAttributes = {
    policy_id: -1,
    user_id: -1,
};

export const quizAttributes: QuizAttributes = {
    title: "Quiz",
    max_attempts: 5,
    manual_id: -1,
    prevent_edit: false,
    prevent_delete: false,
    updated_by_user_id: -1,
};

export const quizSectionAttributes: QuizSectionAttributes = {
    title: "Section",
    updated_by_user_id: -1,
    quiz_id: -1,
};

export const quizQuestionAttributes: QuizQuestionAttributes = {
    question: "Question",
    type: "radio",
    quiz_section_id: -1,
    updated_by_user_id: -1,
};

export const quizAnswerAttributes: QuizAnswerAttributes = {
    answer: "Answer",
    correct: false,
    quiz_question_id: -1,
    updated_by_user_id: -1,
};

export const quizAttemptAttributes: QuizAttemptAttributes = {
    quiz_id: -1,
    user_id: -1,
};

export const resultAttributes: QuizResultAttributes = {
    quiz_answer_id: -1,
    quiz_attempt_id: -1,
    quiz_question_id: -1,
};

export const eventAttributes: EventAttributes = {
    name: "Event",
    status: "FAIL",
    user_id: null,
    business_id: null,
};

export default {
    business: businessAttributes,
    membership: membershipAttributes,
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
