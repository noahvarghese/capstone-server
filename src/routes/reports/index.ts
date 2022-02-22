import authenticated from "@middleware/authenticated";
import { Router } from "express";
import adminRouter from "./admin";

const router = Router();

router.use(authenticated);

router.use("/admin", adminRouter);

export default router;
