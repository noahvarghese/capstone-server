import { Router } from "express";
import idRoutes from "./{id}";
import { getBusinessController } from "./controllers";

const router = Router();

router.get("/", getBusinessController);
router.use("/:id", idRoutes);

export default router;
