import Logs from "@noahvarghese/logger";
import { NextFunction, Request, Response } from "express";
import { getConnection } from "typeorm";

const dbConnection = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const connection = getConnection();
        req.dbConnection = connection;
        next();
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
        return;
    }
};

export default dbConnection;
