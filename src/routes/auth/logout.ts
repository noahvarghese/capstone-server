import { Request, Response, Router } from "express";
import Logs from "@util/logs/logs";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            Logs.Error(err.message);
            res.sendStatus(400);
            return;
        }

        try {
            const { SESSION_ID } = process.env;

            if (!SESSION_ID) {
                res.sendStatus(500);
                throw new Error("Session ID not set");
            }

            res.clearCookie(SESSION_ID);
            res.sendStatus(200);
        } catch (_e) {
            const e = _e as Error;
            Logs.Error(e.message);
            res.sendStatus(500);
        }
    });
});

export default router;
