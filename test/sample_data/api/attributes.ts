import { RegisterBusinessProps } from "@routes/auth/signup";
import modelAttributes from "../model/attributes";
import { LoginProps } from "@routes/auth/login";
import { ApiRoute } from "./dependencies";
import { InviteUserProps } from "@routes/user/invite";
import { deepClone } from "@util/obj";

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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AcceptInviteProps {}

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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LogoutProps {}

const logout = (): LogoutProps => deepClone({});

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AuthCheckProps {}

const authCheck = (): AuthCheckProps => deepClone({});

export interface RequestResetPasswordProps {
    email: string;
}

const requestResetPassword = (): RequestResetPasswordProps =>
    deepClone({ email: user.email });

const attributes: {
    [i in ApiRoute]: () =>
        | RegisterBusinessProps
        | LoginProps
        | InviteUserProps
        | AcceptInviteProps
        | ResetPasswordProps
        | LogoutProps
        | AuthCheckProps
        | RequestResetPasswordProps;
} = {
    registerBusiness,
    requestResetPassword,
    login,
    inviteUser,
    acceptInvite,
    resetPassword,
    logout,
    authCheck,
};

export default attributes;
