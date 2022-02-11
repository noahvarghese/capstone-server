import { Router } from "express";
import requireParam from "@middleware/require_param";
import roleRouter from "./roles";
import deleteController from "./delete";
import getController from "./get";
import putController from "./put";

const router = Router();

const middleware = requireParam("id", (val: string) => !isNaN(Number(val)));
router.use(middleware);

router.get("/", getController);
router.put("/", putController);
router.delete("/", deleteController);

router.use("/roles", roleRouter);

export default router;
