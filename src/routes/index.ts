import { Request, Response, Router } from "express";
import Logs from "../util/logs/logs";
import { client } from "../util/permalink";
import authRouter from "./auth";
import departmentRouter from "./department";
import userRouter from "./user";
import permissionRoute from "./permission";
import roleRouter from "./role";
import settingsRoute from "./settings";
import memberRoute from "./member";

const router = Router();

/* Uncomment after creating the other routes */
router.use("/auth", authRouter);
router.use("/departments", departmentRouter);
router.use("/members", memberRoute);
router.use("/permission", permissionRoute);
router.use("/roles", roleRouter);
router.use("/settings", settingsRoute);
router.use("/user", userRouter);

// Default route handler to serve the website if requests are made
router.use("/*", (req: Request, res: Response) => {
    Logs.Log("Invalid request to", req.originalUrl);

    let redirectURL = client();

    if (req.originalUrl !== "/") {
        if (req.originalUrl[0] === "/") {
            redirectURL += req.originalUrl.substring(1);
        }
    }
    res.redirect(redirectURL);
});

export default router;
