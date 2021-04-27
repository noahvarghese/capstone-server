import { Router } from "express";
import loginRoute from "./login";
import logoutRoute from "./logout";
import signupRoute from "./signup";
import resetRoute from "./reset";

const router = Router();

router.use("/login", loginRoute);
router.use("/signup", signupRoute);
router.use("/logout", logoutRoute);
router.use("/reset", resetRoute);

export default router;
