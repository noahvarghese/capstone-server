import DataServiceError from "@util/errors/service";
import { Request, Response } from "express";
import validator from "validator";
import { loginHandler } from "./handler";

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
