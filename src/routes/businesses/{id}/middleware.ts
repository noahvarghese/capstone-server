import { NextFunction, Request, Response } from "express";

export default (req: Request, res: Response, next: NextFunction): void => {
    const {
        params: { id },
    } = req;

    if (isNaN(Number(id))) {
        res.sendStatus(400);
        return;
    }

    next();
};
