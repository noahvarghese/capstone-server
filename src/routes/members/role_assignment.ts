import Department from "@models/department";
import Permission from "@models/permission";
import Role from "@models/role";
import UserRole from "@models/user/user_role";
import { Router, Request, Response } from "express";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    const {
        SqlConnection,
        body: { user_id, role_ids },
        session: { current_business_id, user_id: current_user_id },
    } = req;

    if (!Array.isArray(role_ids)) {
        res.status(400).json({ message: "Must be an array of roles" });
        return;
    }

    //check permissions
    const hasPermission = await Permission.checkPermission(
        Number(current_user_id),
        Number(current_business_id),
        SqlConnection,
        [
            "global_crud_users",
            "global_assign_users_to_department",
            "global_assign_users_to_role",
            "dept_assign_users_to_role",
        ]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    // may find a way to use promise.all
    for (const id of role_ids) {
        const role = await SqlConnection.createQueryBuilder()
            .select("r")
            .from(Role, "r")
            .where("r.id = :role_id", { role_id: id })
            .andWhere("d.business_id = :business_id", {
                business_id: current_business_id,
            })
            .leftJoin(Department, "d", "d.id = r.department_id")
            .getOne();

        if (!role) {
            res.status(400).json({
                message: "Role provided is not apart of current business",
            });
            return;
        }

        const primaryUserRole = await SqlConnection.createQueryBuilder()
            .select("ur")
            .from(UserRole, "ur")
            .where("ur.user_id = :user_id", { user_id })
            .andWhere("ur.primary_role_for_user = :defaultRole", {
                defaultRole: true,
            })
            .andWhere("d.business_id = :business_id", {
                business_id: current_business_id,
            })
            .leftJoin(Role, "r", "r.id = ur.role_id")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .getOne();

        const isDefault = primaryUserRole === undefined;

        await SqlConnection.manager.insert(
            UserRole,
            new UserRole({
                primary_role_for_user: isDefault,
                role_id: id,
                user_id: user_id,
                updated_by_user_id: current_user_id,
            })
        );
    }

    res.sendStatus(200);
    return;
});

export default router;
