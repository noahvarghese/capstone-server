import Department from "@models/department";
import Permission from "@models/permission";
import Role from "@models/role";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
        SqlConnection,
    } = req;

    //check permissions
    const hasPermission = await Permission.checkPermission(
        Number(user_id),
        Number(current_business_id),
        SqlConnection,
        [
            "global_crud_role",
            "global_assign_resources_to_role",
            "global_assign_users_to_role",
        ]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    try {
        const returnVal: {
            id: number;
            name: string;
            numMembers: number;
            department: string;
        }[] = [];

        const roles = await SqlConnection.createQueryBuilder()
            .select("r")
            .from(Role, "r")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .where("d.business_id = :business_id", {
                business_id: current_business_id,
            })
            .getMany();

        for (const role of roles) {
            const numMembers = await SqlConnection.createQueryBuilder()
                .select("COUNT(ur.user_id)", "count")
                .from(Role, "r")
                .where("r.id = :role_id", { role_id: role.id })
                .leftJoin(UserRole, "ur", "ur.role_id = r.id")
                .getRawMany();

            const department = await SqlConnection.manager.findOneOrFail(
                Department,
                {
                    where: { id: role.department_id },
                }
            );

            returnVal.push({
                id: role.id,
                name: role.name,
                numMembers: numMembers[0].count,
                department: department.name,
            });
        }

        res.status(200).json({
            data: returnVal,
        });
        return;
    } catch (_e) {
        const e = _e as Error;
        Logs.Error(e.message);
        res.status(500).json({ message: "Unable to get roles" });
        return;
    }
});

router.post("/", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
        SqlConnection,
        body: { name, department: department_id, ...rest },
    } = req;

    //check permissions
    const hasPermission = await Permission.checkPermission(
        Number(user_id),
        Number(current_business_id),
        SqlConnection,
        ["global_crud_role"]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    if (!department_id) {
        res.status(400).json({ message: "department is required" });
        return;
    }

    // check role exists
    const count = await SqlConnection.manager.count(Role, {
        where: { name, department_id },
    });

    if (count > 0) {
        res.status(405).json({ message: "role exists" });
        return;
    }

    // try create
    try {
        const permissionResult = await SqlConnection.manager.insert(
            Permission,
            new Permission({ ...rest, updated_by_user_id: user_id })
        );

        const result = await SqlConnection.manager.insert(
            Role,
            new Role({
                name,
                department_id,
                permission_id: permissionResult.identifiers[0].id,
                updated_by_user_id: user_id,
            })
        );

        if (result.identifiers.length === 1) {
            res.sendStatus(201);
            return;
        }
    } catch (_e) {
        const e = _e as Error;
        Logs.Error(e.message);
        res.status(500).json({ message: "Error creating role" });
    }
});

router.delete("/", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
        SqlConnection,
        body: { ids },
    } = req;

    const hasPermission = await Permission.checkPermission(
        Number(user_id),
        Number(current_business_id),
        SqlConnection,
        ["global_crud_role"]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    // check for any user_role associations
    // need route to disassociate all users from role
    try {
        const count = await SqlConnection.manager.count(UserRole, {
            where: ids.map((id: number) => ({ role_id: id })),
        });

        if (count > 0) {
            const message = `There are users associated with ${
                ids.length > 1 ? "at least one of these roles," : "this role,"
            } please reassign them`;

            res.status(400).json({
                message,
            });
            return;
        }
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error("Count error", message);
        res.status(500).json({
            message: "Unable to count user assignments to role",
        });
        return;
    }

    try {
        await SqlConnection.manager.delete(Role, ids);
        res.sendStatus(200);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(500).json({ message: "Unable to delete Role" });
    }
});
export default router;
