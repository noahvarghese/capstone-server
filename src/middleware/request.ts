import { NextFunction, Request, Response } from "express";
import Logs from "@util/logs/logs";

export const parseBodyToJSON = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        req.body =
            typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        next();
    } catch (_e) {
        const e = _e as Error;
        Logs.Error(e.message);
        res.status(500).send("Failed to parse request body");
    }
};

export const parseQueryToJSON = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        req.query =
            typeof req.query === "string" ? JSON.parse(req.query) : req.query;

        next();
    } catch (_e) {
        const e = _e as Error;
        Logs.Error(e.message);
        res.status(500).send("Failed to parse URL query");
    }
};

export const parseParamToJSON = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        req.params =
            typeof req.params === "string" ? JSON.parse(req.params) : req.query;

        next();
    } catch (_e) {
        const e = _e as Error;
        Logs.Error(e.message);
        res.status(500).send("Failed to parse URL parameters");
    }
};
