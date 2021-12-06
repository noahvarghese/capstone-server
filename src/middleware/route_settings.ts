import { NextFunction, Request, Response } from "express";
import Routes from "./routes.json";
import Logs from "@util/logs/logs";

function getRoute(req: Request): RouteSetting | undefined {
    // trim trailing backslash if there is one
    const path =
        req.path.length > 1 && req.path[req.path.length - 1] === "/"
            ? req.path.slice(0, req.path.length - 1)
            : req.path;

    const matchedRoutes = Routes.filter(
        (r) =>
            (!new RegExp(r.url).test(r.url)
                ? new RegExp(r.url).test(path)
                : r.url === path) && r.method === req.method.toLowerCase()
    );

    if (matchedRoutes.length !== 1) {
        return undefined;
    } else {
        return matchedRoutes[0] as RouteSetting;
    }
}

export const routeSettings = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const route = getRoute(req);

    if (!route) {
        const message = `Invalid request configuration ${req.path} ${req.method}`;
        Logs.Error(message);
        res.status(400).json({ message });
        return;
    }

    req.routeSettings = route;
    next();
};
