import modelDependencies from "../model/dependencies";

export type ApiRoute =
    | "registerBusiness"
    | "login"
    | "inviteUser"
    | "acceptInvite"
    | "forgotPassword"
    | "resetPassword"
    | "logout"
    | "authCheck";

const dependencies: { [i in ApiRoute]: ApiRoute[] } = {
    registerBusiness: [],
    login: ["registerBusiness"],
    inviteUser: ["registerBusiness", "login"],
    acceptInvite: ["registerBusiness", "login", "inviteUser"],
    forgotPassword: ["registerBusiness"],
    resetPassword: ["registerBusiness"],
    logout: ["registerBusiness", "login"],
    authCheck: ["registerBusiness", "login"],
};

export const urls: { [i in ApiRoute]: string | ((token: string) => string) } = {
    registerBusiness: "auth/register",
    login: "auth/login",
    inviteUser: "user/invite",
    acceptInvite: (token: string) => `user/invite/${token}`,
    forgotPassword: "auth/forgot_password",
    resetPassword: (token: string) => `auth/reset_password/${token}`,
    logout: "auth/logout",
    authCheck: "auth",
};

export default dependencies;

export const teardown_dependencies: { [i in ApiRoute]: string[] } = {
    registerBusiness: modelDependencies["userRole"],
    login: modelDependencies["userRole"],
    inviteUser: [...modelDependencies["userRole"], "event"],
    acceptInvite: [...modelDependencies["userRole"], "event"],
    forgotPassword: modelDependencies["userRole"],
    resetPassword: modelDependencies["userRole"],
    logout: modelDependencies["userRole"],
    authCheck: modelDependencies["userRole"],
};
