import User from "@models/user/user";
import Logs from "@noahvarghese/logger";
import { resetPasswordEmail } from "@services/email";
import { Request, Response } from "express";
import validator from "validator";

export const resetPasswordController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        dbConnection: connection,
        params: { token },
        body: { password, confirm_password },
    } = req;

    if (validator.isEmpty(token ?? "", { ignore_whitespace: true })) {
        res.sendStatus(401);
        return;
    }

    if (
        password !== confirm_password ||
        validator.isEmpty(password ?? "", { ignore_whitespace: true }) ||
        validator.isEmpty(confirm_password ?? "", { ignore_whitespace: true })
    ) {
        res.sendStatus(400);
        return;
    }

    const user = await connection.manager.findOne(User, { where: { token } });

    if (!user || !user.compareToken(token)) {
        res.sendStatus(401);
        return;
    }

    try {
        await user.resetPassword(password);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(500).send("Failed to reset password");
        return;
    }

    await connection.manager.update(User, user.id, {
        password: user.password,
    });

    if (await resetPasswordEmail(connection, user)) res.sendStatus(200);
    else res.sendStatus(500);
};
