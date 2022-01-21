import { Request, Response } from "express";
import { getConnection } from "typeorm";
import validator from "validator";
import Business from "@models/business";
import User from "@models/user/user";
import * as businessService from "@services/data/business";
import * as userService from "@services/data/user";
import { emptyChecker, isPhone, isPostalCode } from "@util/validators";
import ServiceError, {
    dataServiceResponse,
    ServiceErrorReasons,
} from "@util/errors/service";

export interface RegisterBusinessProps {
    name: string;
    address: string;
    city: string;
    postal_code: string;
    province: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    confirm_password: string;
}

export const emptyRegisterBusinessProps = (): RegisterBusinessProps => ({
    name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    province: "",
    password: "",
    confirm_password: "",
});

const registerValidator = async (
    props: RegisterBusinessProps
): Promise<void> => {
    // validation
    const result = emptyChecker<RegisterBusinessProps>(
        Object.assign(emptyRegisterBusinessProps(), props)
    );

    if (result) {
        throw new ServiceError(
            result.message,
            ServiceErrorReasons.PARAMETERS_MISSING,
            result.field
        );
    }

    // Validate that data is in the expected format
    if (validator.isEmail(props.email) === false) {
        throw new ServiceError(
            "Invalid email",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "email"
        );
    }
    if (!isPhone(props.phone)) {
        throw new ServiceError(
            "Invalid phone number",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "phone"
        );
    }
    if (!isPostalCode(props.postal_code)) {
        throw new ServiceError(
            "Invalid postal code",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "postal_code"
        );
    }
    if (props.password.length < 8) {
        throw new ServiceError(
            "Password must be at least 8 characters",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "password"
        );
    }
    if (props.password !== props.confirm_password) {
        throw new ServiceError(
            "Passwords do not match",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "password"
        );
    }

    const connection = getConnection();

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
                ServiceErrorReasons.PARAMETERS_MISSING
            );
        }
        return;
    });
};

const register = async (req: Request, res: Response): Promise<void> => {
    const { body } = req;

    try {
        await registerValidator(body);
        const user_id = await userService.create(body);
        const business_id = await businessService.create(body, user_id);
        // assign user to admin department
        // create membership with business

        req.session.business_ids = [business_id];
        req.session.user_id = user_id;
        req.session.current_business_id = business_id;

        res.sendStatus(201);
    } catch (e) {
        const { message, reason, field } = e as ServiceError;
        res.status(dataServiceResponse(reason)).json({ message, field });
    }
};

export default register;
