import { LoginProps } from "@routes/auth/login";
import modelAttributes from "@test/model/attributes";
import { deepClone } from "@util/obj";
import AuthKeys from "../keys/auth";

const user = modelAttributes.user();

export type LogoutProps = Record<string, never>;
export type AuthCheckProps = Record<string, never>;
export type AuthTypes = Record<
    AuthKeys,
    () => LoginProps | LogoutProps | AuthCheckProps
>;

const logout = (): LogoutProps => deepClone({});
const authCheck = (): AuthCheckProps => deepClone({});
const login = (): LoginProps =>
    deepClone({
        email: user.email,
        password: user.password,
    });

const attributes: AuthTypes = {
    login,
    logout,
    authCheck,
};

export default attributes;
