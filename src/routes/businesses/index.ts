import { Router } from "express";
import idRoutes from "./{id}";
import middleware from "./middleware";
import { getBusinessController } from "./get_controller";

const router = Router();

router.use(middleware);

router.get("/", getBusinessController);
router.use("/:id", idRoutes);

export default router;
