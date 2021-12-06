import { Router, Request, Response } from "express";
import loginRoute from "./login";
import logoutRoute from "./logout";
import registerRoute from "./register";
import forgotRoute from "./forgot_password";
import resetRoute from "./reset_password";

const router = Router();

router.use("/login", loginRoute);
router.use("/register", registerRoute);
router.use("/logout", logoutRoute);
router.use("/forgot_password", forgotRoute);
router.use("/reset_password", resetRoute);

router.post("/", (_: Request, res: Response) => {
    res.sendStatus(200);
});

export default router;
