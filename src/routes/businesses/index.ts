import { Router } from "express";
import idRoutes from "./{id}";
import { getBusinessController } from "./get_controller";
import authenticated from "@middleware/authenticated";

const router = Router();

router.use(authenticated);

router.get("/", getBusinessController);
router.use("/:id", idRoutes);

export default router;
