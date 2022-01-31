import { NextFunction, Request, Response } from "express";
import Logs from "@util/logs/logs";
import { client } from "@util/permalink";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const publicRoutes: (string | RegExp)[] = [
        "/auth/login",
        "/auth/register",
        /^\/auth\/forgot_password/,
        /^\/auth\/reset_password\/\w+$/,
        /^\/members\/invite\/\w+/,
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
        Boolean(req.session.user_id) &&
        Boolean(req.session.current_business_id) &&
        Boolean(req.session.business_ids);

    if (
        (loggedIn ? !requestedPublicResource : requestedPublicResource) ||
        requestedOpenResource
    ) {
        next();
        return;
    } else {
        Logs.Error(
            "Invalid request to",
            req.originalUrl,
            "logged in =",
            loggedIn
        );
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
                res.redirect(client(""));
                return;
            } catch (_e) {
                const e = _e as Error;
                Logs.Error(e.message);
                res.redirect(client(""));
                return;
            }
        });
    }
};

const middlewares = {
    requireAuth,
};

export default Object.values(middlewares);
