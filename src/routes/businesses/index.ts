import { Router } from "express";
import idRoutes from "./{id}";
import { getBusinessController } from "./get";
import authenticated from "@middleware/authenticated";

const router = Router();

router.use(authenticated);

router.get("/", getBusinessController);
router.use("/:id", idRoutes);

export default router;
