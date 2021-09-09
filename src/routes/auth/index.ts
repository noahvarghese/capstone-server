import { Router } from "express";
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

export default router;
