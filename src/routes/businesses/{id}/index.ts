import { Router } from "express";
import { setCurrentBusinessController } from "./post_controller";
import { setDefaultBusinessController } from "./put_controller";
import middleware from "./middleware";

const router = Router();

router.use(middleware);
router.post("/", setCurrentBusinessController);
router.put("/", setDefaultBusinessController);

export default router;
