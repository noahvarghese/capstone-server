import { NextFunction, Request, Response } from "express";
import Logs from "../util/logs/logs";
import { client } from "../util/permalink";
import { getConnection } from "typeorm";

const clearCookie = (req: Request, res: Response, next: NextFunction) => {
    if (req.cookies.sid && !req.session.user_id) {
        Logs.Event("Cleared cookie");
        res.clearCookie(process.env.SESSION_ID ?? "sid");
    }
    next();
};

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const publicRoutes: (string | RegExp)[] = [
        "/auth",
        "/auth/login",
        "/auth/signup",
        /^\/auth\/resetPassword\//,
        "/auth/requestResetPassword",
    ];
    let requestedPublicResource = false;

    if (req.originalUrl === "/") {
        next();
        return;
    }

    for (const route of publicRoutes) {
        if (route instanceof RegExp) {
            if (route.test(req.originalUrl)) {
                requestedPublicResource = true;
            }
        } else {
            if (req.originalUrl === route) {
                requestedPublicResource = true;
                break;
            }
        }
    }

    if (requestedPublicResource === false && !req.session.user_id) {
        res.redirect(client("login"));
        return;
    }

    next();
};

const retrieveConnection = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const connection = getConnection();

    if (!connection) {
        res.status(500).json({ message: "Could not connect to database." });
        return;
    }

    req.SqlConnection = connection;
    next();
};

const parseRequestBodyToJSON = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.body =
            typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        next();
    } catch (e) {
        Logs.Error(e.message);
        res.sendStatus(500);
    }
};

const middlewares = {
    clearCookie,
    requireAuth,
    retrieveConnection,
    parseRequestBodyToJSON,
};

export default Object.values(middlewares);
