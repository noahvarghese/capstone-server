import { Request, Response, Router } from "express";
import * as businessController from "@controllers/business";
import * as settingsController from "@controllers/settings";
import authRouter from "@routes/auth";
import departmentRouter from "@routes/department";
import roleRouter from "@routes/roles";
import memberRoute from "@routes/member";
import Logs from "@util/logs/logs";
import { client } from "@util/permalink";

const router = Router();

router.use("/auth", authRouter);
router.use("/departments", departmentRouter);
router.use("/members", memberRoute);
router.use("/roles", roleRouter);

router.get("/settings/nav", settingsController.getNav);
router.get("/businesses", businessController.getAll);

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
