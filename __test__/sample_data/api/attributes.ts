import { RegisterBusinessProps } from "@routes/auth/register";
import modelAttributes from "../model/attributes";
import { LoginProps } from "@routes/auth/login";
import { InviteUserProps } from "@routes/members/invite";
import { deepClone } from "@test/util/obj";

const business = modelAttributes.business();
const user = modelAttributes.user();

const registerBusiness = (): RegisterBusinessProps =>
    deepClone({
        name: business.name,
        address: business.address,
        city: business.city,
        postal_code: business.postal_code,
        province: business.province,
        first_name: user.first_name,
        last_name: user.last_name,
        password: user.password,
        confirm_password: user.password,
        email: user.email,
        phone: user.phone,
    });

export interface CreateDepartmentProps {
    name: string;
}
const createDepartment = (): CreateDepartmentProps =>
    deepClone({ name: "TEST" });

export type DeleteDepartmentProps = undefined;

const deleteDepartment = (): DeleteDepartmentProps => undefined;

export interface EditDepartmentProps {
    name: string;
}

const editDepartment = (): EditDepartmentProps => deepClone({ name: "YOLO" });

export type DeleteRoleProps = undefined;

const deleteRole = (): DeleteRoleProps => undefined;

const login = (): LoginProps =>
    deepClone({
        email: user.email,
        password: user.password,
    });

const inviteUser = (): InviteUserProps =>
    deepClone({
        first_name: user.first_name,
        last_name: user.last_name,
        email: process.env.SECONDARY_TEST_EMAIL ?? "",
        phone: "4168245567",
    });

export type AcceptInviteProps = Record<string, never>;

const acceptInvite = (): AcceptInviteProps => deepClone({});

export interface ResetPasswordProps {
    password: string;
    confirm_password: string;
}

const resetPassword = (): ResetPasswordProps =>
    deepClone({
        password: "newpassword",
        confirm_password: "newpassword",
    });

export type LogoutProps = Record<string, never>;

const logout = (): LogoutProps => deepClone({});

export type AuthCheckProps = Record<string, never>;

const authCheck = (): AuthCheckProps => deepClone({});

export interface ForgotPasswordProps {
    email: string;
}

const forgotPassword = (): ForgotPasswordProps =>
    deepClone({ email: user.email });

export interface CreateRoleProps {
    name: string;
    department: number[];
    global_crud_users: boolean;
    global_crud_department: boolean;
    global_crud_role: boolean;
    global_crud_resources: boolean;
    global_assign_users_to_department: boolean;
    global_assign_users_to_role: boolean;
    global_assign_resources_to_department: boolean;
    global_assign_resources_to_role: boolean;
    global_view_reports: boolean;
    dept_crud_role: boolean;
    dept_crud_resources: boolean;
    dept_assign_users_to_role: boolean;
    dept_assign_resources_to_role: boolean;
    dept_view_reports: boolean;
}

const createRole = (): CreateRoleProps =>
    deepClone({
        name: "TEST",
        department: [-1],
        dept_assign_resources_to_role: false,
        dept_assign_users_to_role: false,
        dept_crud_resources: false,
        dept_crud_role: false,
        dept_view_reports: false,
        global_assign_resources_to_department: false,
        global_assign_resources_to_role: false,
        global_assign_users_to_department: false,
        global_assign_users_to_role: false,
        global_crud_department: false,
        global_crud_resources: false,
        global_crud_role: false,
        global_crud_users: false,
        global_view_reports: false,
    });

export interface IApiRoute {
    registerBusiness: () => RegisterBusinessProps;
    forgotPassword: () => ForgotPasswordProps;
    login: () => LoginProps;
    inviteUser: () => InviteUserProps;
    acceptInvite: () => AcceptInviteProps;
    resetPassword: () => ResetPasswordProps;
    logout: () => LogoutProps;
    authCheck: () => AuthCheckProps;
    createRole: () => CreateRoleProps;
    deleteRole: () => DeleteRoleProps;
    createDepartment: () => CreateDepartmentProps;
    deleteDepartment: () => DeleteDepartmentProps;
    editDepartment: () => EditDepartmentProps;
}

const attributes: IApiRoute = {
    registerBusiness,
    forgotPassword,
    login,
    inviteUser,
    acceptInvite,
    resetPassword,
    logout,
    authCheck,
    createRole,
    deleteRole,
    createDepartment,
    deleteDepartment,
    editDepartment,
};

export default attributes;
