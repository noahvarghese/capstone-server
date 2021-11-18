import { deepClone } from "@util/obj";
import modelAttributes from "@test/model/attributes";
import PasswordKeys from "../keys/password";

const user = modelAttributes.user();

export type ResetPasswordProps = Record<
    "password" | "confirm_password",
    string
>;
export type ForgotPasswordProps = Record<"email", string>;
export type PasswordTypes = Record<
    PasswordKeys,
    () => ResetPasswordProps | ForgotPasswordProps
>;

const resetPassword = (): ResetPasswordProps =>
    deepClone({
        password: "newpassword",
        confirm_password: "newpassword",
    });
const forgotPassword = (): ForgotPasswordProps =>
    deepClone({ email: user.email });

const attributes: PasswordTypes = {
    resetPassword,
    forgotPassword,
};

export default attributes;
