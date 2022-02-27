import deleteController from "@routes/members/{user_id}/delete";
import { Router } from "express";
import getController from "./get";
import putController from "./put";
import membersRoute from "./members";
import manualsRoute from "./manuals";

const router = Router({ mergeParams: true });

router.use("/manuals", manualsRoute);
router.use("/members", membersRoute);

router.get("/", getController);
router.put("/", putController);
router.delete("/", deleteController);

export default router;
