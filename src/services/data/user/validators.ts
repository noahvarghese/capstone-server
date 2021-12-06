import Business from "@models/business";
import User from "@models/user/user";
import ServiceError, { ServiceErrorReasons } from "@util/errors/service_error";
import { emptyChecker, isPhone, isPostalCode } from "@util/validators";
import { Connection } from "typeorm";
import validator from "validator";
import {
    emptyInviteUser,
    emptyRegisterBusinessProps,
    InviteMemberProps,
    RegisterBusinessProps,
} from ".";

export const sendInviteValidator = (props: InviteMemberProps): void => {
    const userInfo = Object.assign(emptyInviteUser(), props);
    const result = emptyChecker<InviteMemberProps>(userInfo);

    if (result) {
        throw new ServiceError(
            result.message,
            ServiceErrorReasons.PARAMS,
            result.field
        );
    }

    const { email, phone } = props;

    if (validator.isEmail(email) === false) {
        throw new ServiceError(
            "Invalid email.",
            ServiceErrorReasons.PARAMS,
            "email"
        );
    }

    if (!isPhone(phone)) {
        throw new ServiceError(
            "Invalid phone number",
            ServiceErrorReasons.PARAMS,
            "phone"
        );
    }
};

export const resetPasswordValidator = (
    token: string,
    password: string,
    confirmPassword: string
): void => {
    if (!token)
        throw new ServiceError("No token provided", ServiceErrorReasons.AUTH);
    if (password !== confirmPassword)
        throw new ServiceError(
            "Passwords do not match",
            ServiceErrorReasons.PARAMS
        );
};

export const registerAdminValidator = async (
    connection: Connection,
    props: RegisterBusinessProps
): Promise<void> => {
    // validation
    const result = emptyChecker<RegisterBusinessProps>(
        Object.assign(emptyRegisterBusinessProps(), props)
    );

    if (result) {
        throw new ServiceError(
            result.message,
            ServiceErrorReasons.PARAMS,
            result.field
        );
    }

    // Validate that data is in the expected format
    if (validator.isEmail(props.email) === false) {
        throw new ServiceError(
            "Invalid email",
            ServiceErrorReasons.PARAMS,
            "email"
        );
    }
    if (!isPhone(props.phone)) {
        throw new ServiceError(
            "Invalid phone number",
            ServiceErrorReasons.PARAMS,
            "phone"
        );
    }
    if (!isPostalCode(props.postal_code)) {
        throw new ServiceError(
            "Invalid postal code",
            ServiceErrorReasons.PARAMS,
            "postal_code"
        );
    }
    if (props.password.length < 8) {
        throw new ServiceError(
            "Password must be at least 8 characters",
            ServiceErrorReasons.PARAMS,
            "password"
        );
    }
    if (props.password !== props.confirm_password) {
        throw new ServiceError(
            "Passwords do not match",
            ServiceErrorReasons.PARAMS,
            "password"
        );
    }

    // more validation
    await Promise.race([
        connection.manager.find(Business, {
            where: { name: props.name },
        }),
        connection.manager.find(User, { where: { email: props.email } }),
    ]).then((res) => {
        if (res.length > 0) {
            throw new ServiceError(
                `${
                    res[0] instanceof Business ? "Business" : "User"
                } already exists`,
                ServiceErrorReasons.PARAMS
            );
        }
        return;
    });
};
