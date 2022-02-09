import authenticated from "@middleware/authenticated";
import requireParam from "@middleware/require_param";
import { Router } from "express";
import { getUserController } from "./get";
import { updateUserController } from "./put";

const requireId = requireParam("id", (v: string) => !isNaN(Number(v)));

const middlewares = [authenticated, requireId];

const router = Router();

router.use(middlewares);
router.put("/", updateUserController);
router.get("/", getUserController);

export default router;
