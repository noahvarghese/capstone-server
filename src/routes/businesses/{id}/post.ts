import { Request, Response } from "express";

export const setCurrentBusinessController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        session: { current_business_id: curr_b_id, business_ids: b_ids },
        params: { id },
    } = req;

    // Did the checks in the middleware
    const current_business_id = Number(curr_b_id);
    const business_id = Number(id);
    const business_ids = b_ids as Array<number>;

    if (current_business_id === business_id) {
        res.sendStatus(200);
        return;
    }

    if (!business_ids.includes(business_id)) {
        res.sendStatus(403);
    } else {
        req.session.current_business_id = business_id;
        res.sendStatus(200);
    }

    return;
};
