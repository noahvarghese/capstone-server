import User from "@models/user/user";
import { sendUserInviteEmail } from "@services/email";
import DataServiceError from "@util/errors/service";
import Logs from "@util/logs/logs";
import { isPhone } from "@util/validators";
import { Request, Response } from "express";
import validator from "validator";
import { postHandler } from "./post_handler";

export const sendInviteController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        body: { email, phone },
        session: { current_business_id, user_id },
        dbConnection,
    } = req;

    // despite checking in the middleware, we need to explicitly define these as numbers
    if (!user_id || !current_business_id) {
        res.sendStatus(401);
        return;
    }

    let field = "";

    if (!validator.isEmail(email ?? "")) field = "email";
    else if (!validator.isEmpty(phone ?? "") && !isPhone(phone))
        field = "phone";

    if (field !== "") {
        res.status(400).send("Invalid " + field);
        return;
    }

    const hasPermissions = await User.hasGlobalPermission(
        dbConnection,
        user_id,
        current_business_id,
        "global_crud_users"
    );

    if (!hasPermissions) {
        res.sendStatus(403);
        return;
    }

    let invitedUserId = NaN;

    try {
        invitedUserId = await postHandler(
            dbConnection,
            { email, phone },
            user_id,
            current_business_id
        );
    } catch (_e) {
        const { code, message } = _e as DataServiceError;
        res.status(code).send(message);
        return;
    }

    try {
        if (
            await sendUserInviteEmail(
                dbConnection,
                current_business_id,
                user_id,
                invitedUserId
            )
        ) {
            res.sendStatus(201);
        } else {
            res.sendStatus(500);
        }
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
    }
};
