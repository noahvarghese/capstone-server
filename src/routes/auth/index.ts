import { Router, Request, Response } from "express";
import loginRoute from "./login";
import logoutRoute from "./logout";
import signupRoute from "./signup";
import requestResetRoute from "./request_reset_password";
import resetRoute from "./reset_password";

const router = Router();

router.use("/login", loginRoute);
router.use("/signup", signupRoute);
router.use("/logout", logoutRoute);
router.use("/resetPassword", resetRoute);
router.use("/requestResetPassword", requestResetRoute);

router.post("/", (req: Request, res: Response) => {
    if (req.session.user_id && req.session.business_id) {
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

export default router;
