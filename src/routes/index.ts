import { Request, Response, Router } from "express";
import { client } from "@util/permalink";
import authRouter from "./auth";
import settingsRoute from "./settings";
import memberRoute from "./members";
import businessRouter from "./businesses";
import Logs from "@noahvarghese/logger";

const router = Router();

/* Uncomment after creating the other routes */
router.use("/auth", authRouter);
router.use("/members", memberRoute);
router.use("/settings", settingsRoute);
router.use("/businesses", businessRouter);

// Default route handler to serve the website if requests are made
router.use("/*", (req: Request, res: Response) => {
    Logs.Error("Invalid request to", req.originalUrl);

    let redirectURL = client();

    if (req.originalUrl !== "/") {
        if (req.originalUrl[0] === "/") {
            redirectURL += req.originalUrl.substring(1);
        }
    }
    res.redirect(redirectURL);
});

export default router;
