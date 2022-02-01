import { Request, Response } from "express";
import validator from "validator";
import User from "@models/user/user";
import DataServiceError from "@util/errors/service";
import {
    forgotPasswordHandler,
    loginHandler,
    registerHandler,
    resetPasswordHandler,
} from "./handlers";
import { requestResetPasswordEmail, resetPasswordEmail } from "@services/email";
import Logs from "@util/logs/logs";
import { isPhone, isPostalCode } from "@util/validators";

export const forgotPasswordController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        body: { email },
        dbConnection,
    } = req;

    if (!validator.isEmail(email)) {
        res.status(400).send("Invalid email");
        return;
    }

    try {
        await forgotPasswordHandler(dbConnection, email);

        const user = await dbConnection.manager.findOneOrFail(User, {
            where: { email },
        });

        if (await requestResetPasswordEmail(user)) res.sendStatus(200);
        else res.sendStatus(500);
    } catch (_e) {
        const { code, message } = _e as DataServiceError;
        res.status(code).send(message);
    }
};

export const loginController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        dbConnection,
        body: { email, password },
    } = req;

    if (
        !validator.isEmail(email) ||
        validator.isEmpty(password, { ignore_whitespace: true })
    ) {
        res.status(400).send("Invalid email OR empty password");
        return;
    }

    try {
        const { user_id, current_business_id, business_ids } =
            await loginHandler(dbConnection, email, password);

        req.session.business_ids = business_ids;
        req.session.current_business_id = current_business_id;
        req.session.user_id = user_id;
        res.sendStatus(200);
    } catch (_e) {
        const { code, message } = _e as DataServiceError;
        res.status(code).send(message);
    }

    return;
};

export const logoutController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { SESSION_ID } = process.env;

    if (!SESSION_ID) {
        Logs.Error("Session ID not set");
        res.sendStatus(500);
        return;
    }

    return await new Promise<void>((resolve) => {
        req.session.destroy((err) => {
            if (err) {
                Logs.Error(err.message);
                res.sendStatus(500);
                resolve();
                return;
            }

            res.clearCookie(SESSION_ID).sendStatus(200);
            resolve();
        });
    });
};

export const resetPasswordController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        dbConnection,
        params: { token },
        body: { password, confirm_password },
    } = req;

    if (validator.isEmpty(token, { ignore_whitespace: true })) {
        res.status(401);
        return;
    }

    if (
        password !== confirm_password ||
        validator.isEmpty(password, { ignore_whitespace: true }) ||
        validator.isEmpty(confirm_password, { ignore_whitespace: true })
    ) {
        res.sendStatus(400);
        return;
    }

    try {
        await resetPasswordHandler(dbConnection, token, password);
    } catch (_e) {
        const { code, message } = _e as DataServiceError;
        res.status(code).send(message);
        return;
    }

    const user = await dbConnection.manager.findOne(User, { where: { token } });

    if (!user) {
        res.sendStatus(500);
        return;
    }

    if (await resetPasswordEmail(user)) res.sendStatus(200);
    else res.sendStatus(500);
};

export const registerController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { body, dbConnection } = req;

    let field = "";

    if (!validator.isEmail(body.email)) field = "email";
    else if (!validator.isEmpty(body.phone) && !isPhone(body.phone))
        field = "phone";
    else if (validator.isEmpty(body.name, { ignore_whitespace: true }))
        field = "name";
    else if (validator.isEmpty(body.first_name, { ignore_whitespace: true }))
        field = "first name";
    else if (validator.isEmpty(body.last_name, { ignore_whitespace: true }))
        field = "last name";
    else if (validator.isEmpty(body.address, { ignore_whitespace: true }))
        field = "address";
    else if (validator.isEmpty(body.city, { ignore_whitespace: true }))
        field = "city";
    else if (isPostalCode(body.postal_code)) field = "postal_code";
    else if (validator.isEmpty(body.province, { ignore_whitespace: true }))
        field = "province";
    else if (validator.isEmpty(body.password, { ignore_whitespace: true }))
        field = "password";
    else if (
        validator.isEmpty(body.confirm_password, { ignore_whitespace: true })
    )
        field = "confirm password";
    else if (body.confirm_password !== body.password)
        field = "confirm password doesn't match password";

    if (field !== "") {
        res.status(400).send(`Invalid field ${field}`);
        return;
    }

    try {
        await registerHandler(dbConnection, body);

        const { user_id, business_ids, current_business_id } =
            await loginHandler(dbConnection, body.email, body.password);

        req.session.business_ids = business_ids;
        req.session.current_business_id = current_business_id;
        req.session.user_id = user_id;

        res.sendStatus(200);
    } catch (_e) {
        const { code, message } = _e as DataServiceError;
        res.status(code).send(message);
    }
};
