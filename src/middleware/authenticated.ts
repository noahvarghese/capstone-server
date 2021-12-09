import { logout } from "@routes/auth/logout";
import Logs from "@util/logs/logs";
import { client } from "@util/permalink";
import { NextFunction, Request, Response } from "express";

/**
 *
 * Needs the request middlewares to be loaded first
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const authenticated = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const route = req.routeSettings;

    const loggedIn =
        Boolean(req.session.user_id) &&
        Boolean(req.session.current_business_id) &&
        (Boolean(req.session.business_ids) ||
            (Array.isArray(req.session.business_ids) &&
                req.session.business_ids.length > 0));

    if (loggedIn ? route.requireAuth : !route.requireAuth) return next();

    Logs.Error("Invalid request to", req.originalUrl, "logged in =", loggedIn);

    // Because the client thinks it is logged out if the request is declined at this stage
    if (loggedIn) logout(req, res).then(() => res.redirect(client("")));
    else res.sendStatus(400);
};
