import authenticated from "@middleware/authenticated";
import { Router } from "express";
import adminRouter from "./admin";
import manualRouter from "./manuals";

const router = Router();

router.use(authenticated);

router.use("/admin", adminRouter);
router.use("/manuals", manualRouter);

export default router;
