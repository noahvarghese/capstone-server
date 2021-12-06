import Logs from "@util/logs/logs";
import { NextFunction, Request, Response } from "express";
import { getConnection } from "typeorm";

export const dbConnection = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const connection = getConnection();

    if (!connection) {
        Logs.Error("Cannot get database connection");
        res.status(500).json({ message: "Could not connect to database." });
        return;
    }

    req.SqlConnection = connection;
    next();
};
