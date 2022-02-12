import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import { NextFunction, Request, Response } from "express";

export default (req: Request, res: Response, next: NextFunction): void => {
    const {
        session: { user_id, current_business_id, business_ids },
    } = req;

    if (!isNumber(user_id)) {
        res.sendStatus(401);
        return;
    } else if (!isNumber(current_business_id)) {
        res.sendStatus(401);
        return;
    } else if (
        !business_ids ||
        !Array.isArray(business_ids) ||
        business_ids.length === 0 ||
        business_ids.find((b) => isNaN(Number(b))) !== undefined
    ) {
        res.sendStatus(401);
        return;
    }

    next();
};
