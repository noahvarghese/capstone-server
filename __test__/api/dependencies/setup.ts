import ApiTest from "..";

const dependencies: { [i in ApiTest]: ApiTest[] } = {
    registerBusiness: [],
    getBusinesses: ["registerBusiness"],
    getNav: ["registerBusiness"],
    login: ["registerBusiness"],
    inviteMember: ["registerBusiness"],
    acceptInvite: ["registerBusiness", "inviteMember"],
    readManyMembers: ["registerBusiness"],
    readOneMember: ["registerBusiness"],
    deleteMember: ["registerBusiness"],
    updateMember: ["registerBusiness"],
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

export default dependencies;
