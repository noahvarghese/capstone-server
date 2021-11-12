import ApiTest from ".";

const urls: { [i in ApiTest]: string | ((token: string) => string) } = {
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

export default urls;