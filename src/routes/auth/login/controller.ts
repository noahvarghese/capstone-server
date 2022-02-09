import { Request, Response } from "express";
import validator from "validator";
import Membership from "@models/membership";
import User from "@models/user/user";
import Logs from "@noahvarghese/logger";

export const loginController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        dbConnection: connection,
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
        const user = await connection.manager.findOne(User, {
            where: { email },
        });

        // Not logged in
        if (
            !user ||
            !user.password ||
            !(await user.comparePassword(password))
        ) {
            res.sendStatus(401);
            return;
        }

        const m = await connection.manager.find(Membership, {
            where: { user_id: user.id },
        });

        if (m.length === 0) {
            res.status(403).send("Please contact your manager");
            return;
        }

        const defaultBusinessId =
            m.find((x) => x.default_option)?.business_id ?? NaN;

        if (isNaN(defaultBusinessId)) {
            res.status(500).send("No default business set");
            return;
        }
        req.session.business_ids = m.map((x) => x.business_id);
        req.session.current_business_id = defaultBusinessId;
        req.session.user_id = user.id;
        res.status(200).send(user.id);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
    }

    return;
};
