import { BusinessAttributes } from "../../models/business";
import { DepartmentAttributes } from "../../models/department";
import { ContentAttributes } from "../../models/manual/content";
import { ManualAttributes } from "../../models/manual/manual";
import { ManualAssignmentAttributes } from "../../models/manual/manual_assignment";
import { PolicyAttributes } from "../../models/manual/policy";
import { ReadAttributes } from "../../models/manual/read";
import { SectionAttributes } from "../../models/manual/section";
import { PermissionAttributes } from "../../models/permission";
import { QuizAttributes } from "../../models/quiz/quiz";
import { RoleAttributes } from "../../models/role";
import { UserAttributes } from "../../models/user/user";
import { UserRoleAttributes } from "../../models/user/user_role";

// Configuration
export const businessAttributes: BusinessAttributes = {
    name: "Oakville Windows and Doors",
    address: "1380 Speers Rd",
    city: "Oakville",
    province: "ON",
    country: "CA",
    postal_code: "L6H1X1",
};

export const userAttributes: UserAttributes = {
    first_name: "Noah",
    last_name: "Varghese",
    email: "varghese.noah@gmail.com",
    password: "password",
    address: "207 Elderwood Trail",
    city: "Oakville",
    postal_code: "L6H1X1",
    province: "ON",
    country: "CA",
    birthday: new Date("1996-08-07"),
    original_phone: "647 771 5777",
    phone: 6477715777,
    business_id: -1,
};

export const departmentAttributes: DepartmentAttributes = {
    name: "Management",
    business_id: 1,
    updated_by_user_id: -1,
};

export const permissionAttributes: PermissionAttributes = {
    edit_policies: true,
    edit_users: true,
    remove_users: true,
    updated_by_user_id: -1,
    view_users: true,
};

export const roleAttributes: RoleAttributes = {
    name: "Manager",
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
    updated_by_user_id: -1,
};

export const manualAssignmentAttributes: ManualAssignmentAttributes = {
    department_id: -1,
    manual_id: -1,
    role_id: -1,
    updated_by_user_id: -1,
};

export const sectionAttributes: SectionAttributes = {
    title: "Section",
    manual_id: -1,
    updated_by_user_id: -1,
};

export const policyAttributes: PolicyAttributes = {
    title: "Policy",
    section_id: -1,
    updated_by_user_id: -1,
};

export const contentAttributes: ContentAttributes = {
    title: "Content",
    content: "Here are some words",
    policy_id: -1,
    updated_by_user_id: -1,
};

export const readAttributes: ReadAttributes = {
    policy_id: -1,
    user_id: -1,
};
