import { Router } from "express";
import loginRoute from "./login";
import logoutRoute from "./logout";
import signupRoute from "./signup";
import requestResetRoute from "./requestResetPassword";
import resetRoute from "./resetPassword";

const router = Router();

router.use("/login", loginRoute);
router.use("/signup", signupRoute);
router.use("/logout", logoutRoute);
router.use("/resetPassword", resetRoute);
router.use("/requestResetPassword", requestResetRoute);

export default router;
