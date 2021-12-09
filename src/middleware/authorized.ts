import * as permissionService from "@services/data/permission";
import { NextFunction, Request, Response } from "express";

export const authorized = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const {
        path,
        SqlConnection,
        routeSettings: route,
        session: { user_id, current_business_id },
    } = req;

    if (route.permissions.length === 0) return next();

    if (route.selfOverride === true) {
        const id =
            // remove trailing backslash if it exists
            (
                path[path.length - 1] === "/"
                    ? path.substring(0, path.length - 2)
                    : path
            )
                // retrieve the last element from url
                .split("/")
                .reverse()[0];

        if (Number(id) === Number(user_id)) return next();
    }

    const hasPermission = await permissionService.check(
        Number(user_id),
        Number(current_business_id),
        SqlConnection,
        route.permissions
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    next();
};
