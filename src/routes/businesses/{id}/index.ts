import { Router } from "express";
import { setCurrentBusinessController } from "./post";
import { setDefaultBusinessController } from "./put";
import requireParam from "@middleware/require_param";

const router = Router();

const middleware = requireParam("id", (val: string) => !isNaN(Number(val)));
router.use(middleware);

router.post("/", setCurrentBusinessController);
router.put("/", setDefaultBusinessController);

export default router;
