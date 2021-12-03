import ApiTest from ".";

const urls: { [i in ApiTest]: string | ((token: string) => string) } = {
    getNav: "settings/nav",
    registerBusiness: "auth/register",
    getBusinesses: "businesses",
    authCheck: "auth",
    login: "auth/login",
    logout: "auth/logout",
    acceptInvite: (token: string) => `members/invite/${token}`,
    inviteMember: "members/invite",
    forgotPassword: "auth/forgot_password",
    resetPassword: (token: string) => `auth/reset_password/${token}`,
    roleAssignment: "members/role_assignment",
    roleRemoval: "members/role_assignment",
    readOneMember: "members",
    deleteMember: "members",
    updateMember: "members",
    readManyMembers: "members",
    readManyRoles: "roles",
    readOneRole: "roles",
    createRole: "roles",
    deleteRole: "roles",
    editRole: "roles",
    memberAssignment: "roles/member_assignment",
    memberRemoval: "roles/member_assignment",
    createDepartment: "departments",
    deleteDepartment: "departments",
    editDepartment: "departments",
};

export default urls;
