import modelDependencies from "../model/dependencies";

export type ApiRoute =
    | "registerBusiness"
    | "login"
    | "inviteUser"
    | "acceptInvite"
    | "requestResetPassword"
    | "resetPassword"
    | "logout"
    | "authCheck";

const dependencies: { [i in ApiRoute]: ApiRoute[] } = {
    registerBusiness: [],
    login: ["registerBusiness"],
    inviteUser: ["registerBusiness", "login"],
    acceptInvite: ["registerBusiness", "login", "inviteUser"],
    requestResetPassword: ["registerBusiness"],
    resetPassword: ["registerBusiness"],
    logout: ["registerBusiness", "login"],
    authCheck: ["registerBusiness", "login"],
};

export const urls: { [i in ApiRoute]: string | ((token: string) => string) } = {
    registerBusiness: "auth/signup",
    login: "auth/login",
    inviteUser: "user/invite",
    acceptInvite: (token: string) => `user/invite/${token}`,
    requestResetPassword: "auth/requestResetPassword",
    resetPassword: (token: string) => `auth/resetPassword/${token}`,
    logout: "auth/logout",
    authCheck: "auth",
};

export default dependencies;

export const teardown_dependencies: { [i in ApiRoute]: string[] } = {
    registerBusiness: modelDependencies["userRole"],
    login: modelDependencies["userRole"],
    inviteUser: [...modelDependencies["userRole"], "event"],
    acceptInvite: [...modelDependencies["userRole"], "event"],
    requestResetPassword: modelDependencies["userRole"],
    resetPassword: modelDependencies["userRole"],
    logout: modelDependencies["userRole"],
    authCheck: modelDependencies["userRole"],
};
