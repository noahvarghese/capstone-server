import { NextFunction, Request, Response } from "express";

export default (
    key: string,
    validator: (val: string) => boolean
): ((req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const param: string = req.params[key];

        if (!validator(param)) {
            res.sendStatus(400);
            return;
        }

        next();
    };
};
