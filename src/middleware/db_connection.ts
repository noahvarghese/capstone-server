import Logs from "@noahvarghese/logger";
import { NextFunction, Request, Response } from "express";
import { getConnection } from "typeorm";

const dbConnection = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const connection = getConnection();

    if (!connection || !connection.isConnected) {
        Logs.Error("Cannot get database connection");
        res.status(500).json({ message: "Could not connect to database." });
        return;
    }

    req.dbConnection = connection;
    next();
};

export default dbConnection;
