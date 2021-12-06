import Permission from "@models/permission";
import { NextFunction, Request, Response } from "express";

export const authorized = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const {
        SqlConnection,
        routeSettings: route,
        session: { user_id, current_business_id },
    } = req;

    if (route.permissions.length === 0) {
        next();
        return;
    }

    const hasPermission = await Permission.checkPermission(
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
