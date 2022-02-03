import Department from "@models/department";
import Membership from "@models/membership";
import Permission from "@models/permission";
import Role from "@models/role";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import { Router, Request, Response } from "express";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    const {
        dbConnection,
        body: { user_id, role_ids },
        session: { current_business_id, user_id: current_user_id },
    } = req;

    if (!Array.isArray(role_ids)) {
        res.status(400).json({ message: "Must be an array of roles" });
        return;
    }

    //check permissions
    const hasPermission = await Permission.hasPermission(
        Number(current_user_id),
        Number(current_business_id),
        dbConnection,
        [
            "global_crud_users",
            "global_assign_users_to_role",
            "dept_assign_users_to_role",
        ]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    // check user is a member
    const membership = await dbConnection.manager.findOne(Membership, {
        where: { user_id, business_id: current_business_id },
    });

    if (!membership) {
        res.status(400).json({
            message: "User is not a member of the business",
        });
        return;
    }

    // may find a way to use promise.all
    for (const id of role_ids) {
        try {
            // check role is part of business
            const role = await dbConnection
                .createQueryBuilder()
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

            await dbConnection.manager.insert(
                UserRole,
                new UserRole({
                    role_id: id,
                    user_id: user_id,
                    updated_by_user_id: current_user_id,
                })
            );
        } catch (e) {
            const { message } = e as Error;
            Logs.Error(message);
            res.status(500).json({
                message: "Unable to assign user to role(s)",
            });
            return;
        }
    }

    res.sendStatus(200);
    return;
});

router.delete("/", async (req: Request, res: Response) => {
    const {
        dbConnection,
        query: { user_id, role_ids },
        session: { current_business_id, user_id: current_user_id },
    } = req;

    if (!Array.isArray(JSON.parse(role_ids as string))) {
        res.status(400).json({ message: "Must be an array of roles" });
        return;
    }

    //check permissions
    const hasPermission = await Permission.hasPermission(
        Number(current_user_id),
        Number(current_business_id),
        dbConnection,
        [
            "global_crud_users",
            "global_assign_users_to_role",
            "dept_assign_users_to_role",
        ]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    // may find a way to use promise.all
    for (const id of JSON.parse(role_ids as string)) {
        try {
            const userRole = await dbConnection.manager.findOneOrFail(
                UserRole,
                {
                    where: { user_id, role_id: id },
                }
            );

            await dbConnection.manager.delete(UserRole, userRole);
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
