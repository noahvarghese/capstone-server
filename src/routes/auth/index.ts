import authenticated from "@middleware/authenticated";
import { Router, Request, Response } from "express";
import forgotPasswordRoute from "./forgot_password";
import loginRoute from "./login";
import logoutRoute from "./logout";
import registerRoute from "./register";
import resetPasswordRoute from "./reset_password/{token}";

const router = Router();

router.use("/forgot_password", forgotPasswordRoute);
router.use("/login", loginRoute);
router.use("/logout", authenticated, logoutRoute);
router.use("/register", registerRoute);
router.use("/reset_password", resetPasswordRoute);

router.post("/", authenticated, (_: Request, res: Response) => {
    res.sendStatus(200);
});

export default router;
