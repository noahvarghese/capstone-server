import { Router } from "express";
import authControllers from "@controllers/auth";

const router = Router();

router.post("/", authControllers.auth);
router.post("/forgot_password", authControllers.forgotPassword);
router.post("/login", authControllers.login);
router.post("/logout", authControllers.logout);
router.post("/register", authControllers.register);
router.post("/reset_password/:token", authControllers.resetPassword);

export default router;
