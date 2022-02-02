import { Request, Response } from "express";
import Logs from "@util/logs/logs";

export const logoutController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { SESSION_ID } = process.env;

    if (!SESSION_ID) {
        Logs.Error("Session ID not set");
        res.sendStatus(500);
        return;
    }

    return await new Promise<void>((resolve) => {
        req.session.destroy((err) => {
            if (err) {
                Logs.Error(err.message);
                res.sendStatus(500);
                resolve();
                return;
            }

            res.clearCookie(SESSION_ID).sendStatus(200);
            resolve();
        });
    });
};
