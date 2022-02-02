import User from "@models/user/user";
import { resetPasswordEmail } from "@services/email";
import DataServiceError from "@util/errors/service";
import { Request, Response } from "express";
import validator from "validator";
import { resetPasswordHandler } from "./handler";

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
