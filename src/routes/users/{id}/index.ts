import authenticated from "@middleware/authenticated";
import { Router } from "express";
import { getUserController } from "./get";
import { updateUserController } from "./put";

const router = Router();

router.use(authenticated);
router.put("/", updateUserController);
router.get("/", getUserController);

export default router;
