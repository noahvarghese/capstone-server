import { Request, Response, Router } from "express";
import Logs from "@util/logs/logs";
import { client } from "@util/permalink";
import authRouter from "./auth";
import departmentRouter from "./departments";
import roleRouter from "./roles";
import Nav from "@services/data/nav";
import * as membershipService from "@services/data/memberships";
import memberRoute from "./members";

const router = Router();

router.use("/auth", authRouter);
router.use("/departments", departmentRouter);
router.use("/members", memberRoute);
router.use("/roles", roleRouter);

router.use("/settings/nav", async (req: Request, res: Response) => {
    const {
        session: { user_id, current_business_id },
    } = req;

    const nav = new Nav(Number(current_business_id), Number(user_id));

    res.status(200).json(await nav.getLinks());
    return;
});

router.get("/businesses", async (req: Request, res: Response) => {
    const {
        session: { user_id },
    } = req;

    res.status(200).json(await membershipService.getAll(Number(user_id)));
});

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
