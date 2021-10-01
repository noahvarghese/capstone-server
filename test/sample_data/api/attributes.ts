import { RegisterBusinessProps } from "@routes/auth/signup";
import modelAttributes from "../model/attributes";
import { LoginProps } from "@routes/auth/login";
import { ApiRoute } from "./dependencies";
import { InviteUserProps } from "@routes/user/invite";

const business = modelAttributes.business();
const user = modelAttributes.user();

const registerBusiness = (): RegisterBusinessProps => ({
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

const login = (): LoginProps => ({
    email: user.email,
    password: user.password,
});

const inviteUser = (): InviteUserProps => ({
    first_name: user.first_name,
    last_name: user.last_name,
    email: process.env.SECONDARY_TEST_EMAIL ?? "",
    phone: "4168245567",
});

export interface RegisterUserProps {
    token: string;
    password: string;
    confirm_password: string;
}

const registerUser = (): RegisterUserProps => ({
    token: "",
    password: "password",
    confirm_password: "password",
});

const attributes: { [i in ApiRoute]: () => unknown } = {
    registerBusiness,
    login,
    inviteUser,
    registerUser,
};

export default attributes;
