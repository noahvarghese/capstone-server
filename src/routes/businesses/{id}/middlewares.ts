import { Request, Response } from "express";

export default (req: Request, res: Response): void => {
    const {
        session: { user_id, current_business_id },
        params: { id },
    } = req;

    if (!user_id || !current_business_id) {
        res.status(401);
        return;
    }

    const business_id = Number(id);

    if (isNaN(business_id)) {
        res.sendStatus(400);
        return;
    }
};
