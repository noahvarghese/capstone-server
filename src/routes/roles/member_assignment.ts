import Department from "@models/department";
import Membership from "@models/membership";
import Role from "@models/role";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import { Router, Request, Response } from "express";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    const {
        SqlConnection,
        body: { user_ids, role_id },
        session: { current_business_id, user_id: current_user_id },
    } = req;

    if (!Array.isArray(user_ids)) {
        res.status(400).json({ message: "Must be an array of users" });
        return;
    }

    // check role is apart of current business
    const role = await SqlConnection.createQueryBuilder()
        .select("r")
        .from(Role, "r")
        .where("r.id = :role_id", { role_id })
        .andWhere("d.business_id = :current_business_id", {
            current_business_id,
        })
        .leftJoin(Department, "d", "d.id = r.department_id")
        .getOne();

    if (!role) {
        res.status(400).json({ message: "Role is not a part of the business" });
        return;
    }

    for (const id of user_ids) {
        try {
            const membership = await SqlConnection.manager.findOne(Membership, {
                where: { user_id: id, business_id: current_business_id },
            });

            if (!membership) {
                res.status(400).json({
                    message: "User is not a member of the business",
                });
                return;
            }

            const primaryUserRole = await SqlConnection.createQueryBuilder()
                .select("ur")
                .from(UserRole, "ur")
                .where("ur.user_id = :user_id", { user_id: id })
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
                    user_id: id,
                    updated_by_user_id: current_user_id,
                    role_id,
                })
            );
        } catch (e) {
            const { message } = e as Error;
            Logs.Error(message);
            res.status(500).json({
                message: "Unable to assign user(s) to role",
            });
            return;
        }
    }

    res.sendStatus(200);
    return;
});

router.delete("/", async (req: Request, res: Response) => {
    const {
        SqlConnection,
        query: { user_ids, role_id },
    } = req;

    if (!Array.isArray(JSON.parse(user_ids as string))) {
        res.status(400).json({ message: "Must be an array of users" });
        return;
    }

    // may find a way to use promise.all
    for (const id of JSON.parse(user_ids as string)) {
        try {
            const userRole = await SqlConnection.manager.findOneOrFail(
                UserRole,
                {
                    where: { user_id: id, role_id },
                }
            );

            await SqlConnection.manager.delete(UserRole, userRole);
        } catch (e) {
            const { message } = e as Error;
            Logs.Error(message);
            res.status(500).json({ message: "Invalid role assignment" });
            return;
        }
    }

    res.sendStatus(200);
    return;
});

export default router;
