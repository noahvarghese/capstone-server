import DataServiceError from "@util/errors/service";
import { Request, Response } from "express";
import { changeDefaultBusinessHandler, isMemberHandler } from "./handlers";

export const setCurrentBusinessController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        dbConnection: connection,
        session: { user_id: u_id, current_business_id: curr_b_id },
        params: { id },
    } = req;

    // Did the checks in the middleware
    const user_id = Number(u_id);
    const current_business_id = Number(curr_b_id);
    const business_id = Number(id);

    if (current_business_id === business_id) {
        res.sendStatus(200);
        return;
    }

    try {
        if (await isMemberHandler(connection, user_id, business_id)) {
            req.session.current_business_id = business_id;
            res.sendStatus(200);
        } else {
            res.sendStatus(403);
        }
    } catch (_e) {
        const { code, message } = _e as DataServiceError;
        res.status(code).send(message);
        return;
    }
};

export const setDefaultBusinessController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        dbConnection: connection,
        session: { user_id: u_id, current_business_id: curr_b_id },
        params: { id },
    } = req;

    // Did the checks in the middleware
    const user_id = Number(u_id);
    const current_business_id = Number(curr_b_id);
    const business_id = Number(id);

    let isMember = current_business_id === business_id;

    if (!isMember) {
        try {
            isMember = await isMemberHandler(connection, user_id, business_id);
        } catch (_e) {
            const { code, message } = _e as DataServiceError;
            res.status(code).send(message);
            return;
        }
    }

    if (!isMember) {
        res.sendStatus(403);
        return;
    }

    try {
        await changeDefaultBusinessHandler(connection, user_id, business_id);
    } catch (_e) {
        const { code, message } = _e as DataServiceError;
        res.status(code).send(message);
        return;
    }
};
