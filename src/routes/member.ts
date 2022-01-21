import * as memberController from "@controllers/member";
import { Router } from "express";
import inviteRoute from "./member_invite";
import roleAssignmentRouter from "./members/role_assignment";

const router = Router();

router.use("/invite", inviteRoute);
router.use("/role_assignment", roleAssignmentRouter);

router.get("/:id", memberController.getOne);
router.get("/", memberController.getAll);
router.delete("/:id", memberController.deleteMembership);
router.put("/:id", memberController.update);

export default router;
