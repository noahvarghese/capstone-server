import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import Logs from "@noahvarghese/logger";
import { requestResetPasswordEmail } from "@services/email";
import { bodyValidators, ExpectedBody } from "@util/formats/body";
import { Request, Response } from "express";
import { uid } from "rand-token";

const options: ExpectedBody = {
    email: { type: "string", required: true, format: "email" },
};

export const forgotPasswordController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { dbConnection } = req;

    let email = "";

    try {
        const data = getJOpts(req.body, options, bodyValidators);
        email = data.email as string;
    } catch (_e) {
        const { message } = _e as Error;
        res.status(400).send(message);
        return;
    }

    if (!dbConnection || !dbConnection.isConnected) {
        res.sendStatus(500);
        return;
    }

    const user = await dbConnection.manager.findOne(User, {
        where: { email },
    });

    if (!user) {
        res.status(400).send("No account for user " + email);
        return;
    }

    await dbConnection.manager.update(
        User,
        { email: email },
        { token: uid(32) }
    );

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
