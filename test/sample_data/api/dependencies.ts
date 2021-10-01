import modelDependencies from "../model/dependencies";
export type ApiRoute =
    | "registerBusiness"
    | "login"
    | "inviteUser"
    | "registerUser";

const dependencies: { [i in ApiRoute]: string[] } = {
    registerBusiness: [],
    login: ["registerBusiness"],
    inviteUser: ["registerBusiness"],
    registerUser: ["registerBusiness", "inviteUser"],
};

export const urls: { [i in ApiRoute]: string } = {
    registerBusiness: "auth/signup",
    login: "auth/login",
    inviteUser: "user/invite",
    registerUser: "auth/signup/user",
};

export default dependencies;

export const teardown_dependencies: { [i in ApiRoute]: string[] } = {
    registerBusiness: modelDependencies["userRole"],
    login: modelDependencies["userRole"],
    inviteUser: [...modelDependencies["userRole"], "event"],
    registerUser: [],
};
