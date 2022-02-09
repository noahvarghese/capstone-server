import User from "@models/user/user";
import Logs from "@noahvarghese/logger";
import { requestResetPasswordEmail } from "@services/email";
import { Request, Response } from "express";
import { uid } from "rand-token";
import validator from "validator";

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

    const user = await dbConnection.manager.findOne(User, {
        where: { email },
    });

    if (!user) {
        res.status(400).send("No account for user " + email);
        return;
    }

    try {
        // gen token
        await dbConnection.manager.update(
            User,
            { email: email },
            { token: uid(32) }
        );
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(500);
        return;
    }

    try {
        if (await requestResetPasswordEmail(dbConnection, user))
            res.sendStatus(200);
        else
            res.status(500).send(
                "Unable to send reset instructions, please try again"
            );
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(500);
        return;
    }
};
