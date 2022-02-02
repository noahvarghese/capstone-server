import { Router, Request, Response } from "express";
import forgotPasswordRoute from "./forgot_password";
import loginRoute from "./login";
import logoutRoute from "./logout";
import registerRoute from "./register";
import resetPasswordRoute from "./reset_password";

const router = Router();

router.use("/forgot_password", forgotPasswordRoute);
router.use("/login", loginRoute);
router.use("/logout", logoutRoute);
router.use("/register", registerRoute);
router.use("/reset_password", resetPasswordRoute);

router.post("/", (req: Request, res: Response) => {
    if (
        req.session.user_id &&
        req.session.business_ids &&
        req.session.current_business_id
    ) {
        res.sendStatus(200);
    } else {
        res.status(401).json();
    }
});

export default router;
