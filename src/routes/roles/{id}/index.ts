import deleteController from "@routes/members/{user_id}/delete";
import { Router } from "express";
import getController from "./get";
import putController from "./put";

const router = Router();

router.get("/", getController);
router.put("/", putController);
router.delete("/", deleteController);

export default router;
