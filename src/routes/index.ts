import { Request, Response, Router } from "express";
import Logs from "@util/logs/logs";
import { client } from "@util/permalink";
import authRouter from "./auth";
import departmentRouter from "./departments";
import roleRouter from "./roles";
import settingsRoute from "./settings";
import memberRoute from "./members";
import businessRouter from "./business";

const router = Router();

/* Uncomment after creating the other routes */
router.use("/auth", authRouter);
router.use("/departments", departmentRouter);
router.use("/members", memberRoute);
router.use("/roles", roleRouter);
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
