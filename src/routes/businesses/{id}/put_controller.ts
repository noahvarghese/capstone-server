import DataServiceError from "@util/errors/service";
import { Request, Response } from "express";
import { setDefaultBusinessHandler } from "./put_handler";

export const setDefaultBusinessController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        dbConnection: connection,
        session: {
            user_id: u_id,
            current_business_id: curr_b_id,
            business_ids: b_ids,
        },
        params: { id },
    } = req;

    // Did the checks in the middleware
    const user_id = Number(u_id);
    const current_business_id = Number(curr_b_id);
    const business_id = Number(id);
    const business_ids = b_ids as Array<number>;

    const isMember =
        current_business_id === business_id ||
        business_ids.includes(business_id);

    if (!isMember) {
        res.sendStatus(403);
        return;
    }

    try {
        await setDefaultBusinessHandler(connection, user_id, business_id);
    } catch (_e) {
        const { code, message } = _e as DataServiceError;
        res.status(code).send(message);
        return;
    }
};
