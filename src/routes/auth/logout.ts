import { Request, Response, Router } from "express";
import Logs from "@util/logs/logs";

const router = Router();

export const logout = (req: Request, res: Response): Promise<void> =>
    new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => {
            err ? reject(err) : resolve();
        });
    })
        .then(() => {
            try {
                const { SESSION_ID } = process.env;

                if (!SESSION_ID) {
                    const message = "Session ID not set";
                    res.status(500).json({ message });
                    Logs.Error(message);
                    return;
                }

                res.clearCookie(SESSION_ID);
                return;
            } catch (_e) {
                const e = _e as Error;
                Logs.Error(e.message);
            }
            return;
        })
        .catch((err) => {
            Logs.Error(err.message);
            res.status(400).json({
                message: "Error occurred destroying session",
            });
            return;
        });

router.post("/", (req: Request, res: Response) =>
    logout(req, res).then(() => res.sendStatus(200))
);

export default router;
