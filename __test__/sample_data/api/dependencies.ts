import modelDependencies from "../model/dependencies";

export type ApiRoute =
    | "getNav"
    | "getBusinesses"
    | "registerBusiness"
    | "login"
    | "inviteUser"
    | "acceptInvite"
    | "forgotPassword"
    | "resetPassword"
    | "logout"
    | "authCheck"
    | "createRole"
    | "readOneRole"
    | "readManyRoles"
    | "deleteRole"
    | "editRole"
    | "createDepartment"
    | "deleteDepartment"
    | "editDepartment";

const dependencies: { [i in ApiRoute]: ApiRoute[] } = {
    registerBusiness: [],
    getBusinesses: ["registerBusiness"],
    getNav: ["registerBusiness"],
    login: ["registerBusiness"],
    inviteUser: ["registerBusiness"],
    acceptInvite: ["registerBusiness", "inviteUser"],
    forgotPassword: ["registerBusiness"],
    resetPassword: ["registerBusiness"],
    logout: ["registerBusiness"],
    authCheck: ["registerBusiness"],
    createRole: ["registerBusiness"],
    deleteRole: ["registerBusiness"],
    editRole: ["registerBusiness"],
    readOneRole: ["registerBusiness"],
    readManyRoles: ["registerBusiness"],
    createDepartment: ["registerBusiness"],
    deleteDepartment: ["registerBusiness"],
    editDepartment: ["registerBusiness"],
};

export const urls: { [i in ApiRoute]: string | ((token: string) => string) } = {
    getNav: "settings/nav",
    registerBusiness: "auth/register",
    getBusinesses: "businesses",
    login: "auth/login",
    inviteUser: "members/invite",
    acceptInvite: (token: string) => `members/invite/${token}`,
    forgotPassword: "auth/forgot_password",
    resetPassword: (token: string) => `auth/reset_password/${token}`,
    logout: "auth/logout",
    authCheck: "auth",
    createDepartment: "departments",
    readManyRoles: "roles",
    readOneRole: "roles",
    createRole: "roles",
    deleteRole: "roles",
    editRole: "roles",
    deleteDepartment: "departments",
    editDepartment: "departments",
};

export default dependencies;

export const teardown_dependencies: { [i in ApiRoute]: string[] } = {
    getNav: modelDependencies["userRole"],
    registerBusiness: modelDependencies["userRole"],
    getBusinesses: modelDependencies["userRole"],
    login: modelDependencies["userRole"],
    inviteUser: [...modelDependencies["userRole"], "event"],
    acceptInvite: [...modelDependencies["userRole"], "event"],
    forgotPassword: modelDependencies["userRole"],
    resetPassword: modelDependencies["userRole"],
    logout: modelDependencies["userRole"],
    authCheck: modelDependencies["userRole"],
    readOneRole: modelDependencies["userRole"],
    readManyRoles: modelDependencies["userRole"],
    createRole: modelDependencies["userRole"],
    deleteRole: modelDependencies["userRole"],
    editRole: modelDependencies["userRole"],
    createDepartment: modelDependencies["userRole"],
    deleteDepartment: modelDependencies["userRole"],
    editDepartment: modelDependencies["userRole"],
};
