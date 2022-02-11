import { Request, Response, Router } from "express";
import { client } from "@util/permalink";
import authRouter from "./auth";
import memberRoute from "./members";
import businessRouter from "./businesses";
import departmentRoute from "./departments";
import roleRouter from "./roles";
import Logs from "@noahvarghese/logger";

const router = Router();

router.use("/auth", authRouter);
router.use("/businesses", businessRouter);
router.use("/members", memberRoute);
router.use("/departments", departmentRoute);
router.use("/roles", roleRouter);

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
