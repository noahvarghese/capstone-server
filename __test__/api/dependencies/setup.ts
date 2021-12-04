import ApiTest from "..";

const dependencies: { [i in ApiTest]: ApiTest[] } = {
    registerBusiness: [],
    getBusinesses: ["registerBusiness"],
    getNav: ["registerBusiness"],
    authCheck: ["registerBusiness"],
    login: ["registerBusiness"],
    logout: ["registerBusiness"],
    inviteMember: ["registerBusiness"],
    acceptInvite: ["registerBusiness", "inviteMember"],
    forgotPassword: ["registerBusiness"],
    resetPassword: ["registerBusiness"],
    readManyMembers: ["registerBusiness"],
    readOneMember: ["registerBusiness"],
    deleteMember: ["registerBusiness"],
    updateMember: ["registerBusiness"],
    roleAssignment: ["registerBusiness"],
    roleRemoval: ["registerBusiness"],
    createRole: ["registerBusiness"],
    deleteRole: ["registerBusiness"],
    memberAssignment: ["registerBusiness"],
    memberRemoval: ["registerBusiness"],
    editRole: ["registerBusiness"],
    readOneRole: ["registerBusiness"],
    readManyRoles: ["registerBusiness"],
    createDepartment: ["registerBusiness"],
    deleteDepartment: ["registerBusiness"],
    editDepartment: ["registerBusiness"],
    readOneDepartment: ["registerBusiness"],
    readManyDepartments: ["registerBusiness"],
};

export default dependencies;
