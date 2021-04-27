import { NextFunction, Request, Response } from "express";
import Logs, { LogLevels } from "../util/logs";
import { client } from "../util/permalink";

const clearCookie = (req: Request, res: Response, next: NextFunction) => {
    if (req.cookies.sid && !req.session.user_id) {
        Logs.addLog("Cleared cookie", LogLevels.EVENT);
        res.clearCookie(process.env.SESSION_ID ?? "sid");
    }
    next();
};

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const publicRoutes = ["/", "login", "signup"];
    let requestedPublicResource = false;

    for (const route of publicRoutes) {
        if (req.originalUrl.includes(route)) {
            requestedPublicResource = true;
            break;
        }
    }

    if (requestedPublicResource === false && !req.session.user_id) {
        res.redirect(`https://${client}`);
        return;
    }

    next();
};

const middlewares = {
    clearCookie,
    requireAuth,
};

export default Object.values(middlewares);
