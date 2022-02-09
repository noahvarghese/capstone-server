import authenticated from "@middleware/authenticated";
import { Router } from "express";
import { logoutController } from "./post";

const router = Router();

router.use(authenticated);
router.post("/", logoutController);

export default router;
