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
        "/auth/login",
        "/auth/register",
        /^\/auth\/forgot_password/,
        /^\/auth\/reset_password\/\w+$/,
        /^\/user\/invite\/\w/,
    ];
    const openRoutes: (string | RegExp)[] = [/^\/auth\/?$/];

    let requestedPublicResource = false;
    let requestedOpenResource = false;

    if (req.originalUrl === "/") {
        next();
        return;
    }

    for (const route of publicRoutes) {
        if (route instanceof RegExp) {
            if (route.test(req.originalUrl)) {
                requestedPublicResource = true;
                break;
            }
        } else {
            if (req.originalUrl === route) {
                requestedPublicResource = true;
                break;
            }
        }
    }

    for (const route of openRoutes) {
        if (route instanceof RegExp) {
            if (route.test(req.originalUrl)) {
                requestedOpenResource = true;
                break;
            }
        } else {
            if (req.originalUrl === route) {
                requestedOpenResource = true;
                break;
            }
        }
    }

    const loggedIn =
        req.session.user_id &&
        req.session.current_business_id &&
        req.session.business_ids;

    if (
        (loggedIn ? !requestedPublicResource : requestedPublicResource) ||
        requestedOpenResource
    ) {
        next();
        return;
    } else {
        req.session.destroy((err) => {
            if (err) {
                Logs.Error(err.message);
                res.status(400).json({
                    message: "Error occurred destroying session",
                });
                return;
            }

            try {
                const { SESSION_ID } = process.env;

                if (!SESSION_ID) {
                    res.status(500).json({ message: "Session ID not set" });
                    throw new Error("Session ID not set");
                }

                res.clearCookie(SESSION_ID);
                res.redirect(client("login"));
                return;
            } catch (e) {
                Logs.Error(e.message);
                res.redirect(client("login"));
                return;
            }
        });
    }
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
