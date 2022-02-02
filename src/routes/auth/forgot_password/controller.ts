import User from "@models/user/user";
import { requestResetPasswordEmail } from "@services/email";
import DataServiceError from "@util/errors/service";
import { Request, Response } from "express";
import validator from "validator";
import { forgotPasswordHandler } from "./handler";

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
