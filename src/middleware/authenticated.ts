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
export const authenticated = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const route = req.routeSettings;

    const loggedIn =
        Boolean(req.session.user_id) &&
        Boolean(req.session.current_business_id) &&
        Array.isArray(req.session.business_ids) &&
        req.session.business_ids.length > 0 &&
        // verifies they are valid inputs (val > 0 && !isNaN(val))
        req.session.business_ids.reduce(
            (isNumber: boolean, current) => isNumber && Boolean(current),
            true
        );

    if (loggedIn ? route.requireAuth : !route.requireAuth) return next();

    Logs.Error(
        `User is ${loggedIn ? "" : "not "}logged in when ${route.method}ing ${
            req.path
        }`
    );

    // Because the client thinks it is logged out if the request is declined at this stage
    if (loggedIn) await logout(req, res).then(() => res.redirect(client("")));
    else res.sendStatus(400);
};
