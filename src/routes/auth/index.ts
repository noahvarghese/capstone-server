import { Router, Request, Response } from "express";
import {
    forgotPasswordController,
    loginController,
    logoutController,
    registerController,
    resetPasswordController,
} from "./controllers";

const router = Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post("/logout", logoutController);
router.post("/forgot_password", forgotPasswordController);
router.post("/reset_password/:token", resetPasswordController);

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
