import { Router } from "express";
import { getUserController } from "./get";
import { updateUserController } from "./put";

const router = Router();

router.put("/", updateUserController);
router.get("/", getUserController);

export default router;
