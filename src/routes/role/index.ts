import Department from "@models/department";
import ManualAssignment from "@models/manual/assignment";
import Permission from "@models/permission";
import Role from "@models/role";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import { Router, Request, Response } from "express";
import validator from "validator";

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
        query: { ids: queryIds },
    } = req;

    let ids: number[] = [];

    try {
        ids = Array.from(JSON.parse(queryIds as string));
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(400).json({ message: "Invalid format" });
    }

    // check permissions
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

    // check if users are joined to role
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

    // remove non user associations
    try {
        await SqlConnection.transaction(async (transactionManager) => {
            try {
                await transactionManager
                    .createQueryBuilder()
                    .delete()
                    .from(ManualAssignment)
                    .where("role_id IN (:...ids)", { ids })
                    .execute();
            } catch (_e) {
                const { message } = _e as Error;
                Logs.Error(message);
                throw new Error("Unable to delete Manual Assignments");
            }

            // get permissions to delete after roles are deleted
            const permissions = await transactionManager
                .createQueryBuilder()
                .select("p")
                .from(Permission, "p")
                .leftJoin(Role, "r", "r.permission_id = p.id")
                .where("r.id IN (:...ids)", { ids })
                .getMany();

            try {
                await transactionManager.delete(Role, ids);
            } catch (_e) {
                const { message } = _e as Error;
                Logs.Error(message);
                throw new Error("Unable to delete roles");
            }

            try {
                await transactionManager.remove(permissions);
            } catch (_e) {
                const { message } = _e as Error;
                Logs.Error(message);
                throw new Error("Unable to delete permissions");
            }
        });

        res.sendStatus(200);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(500).json({ message: "Unable to delete role" });
    }
});

router.put("/", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
        SqlConnection,
        query: { id: queryId },
        body: { name, department: department_id, permissions },
    } = req;

    let id: number;

    try {
        if (validator.isNumeric(queryId as string)) {
            id = Number(JSON.parse(queryId as string));
        } else {
            res.status(400).json({ message: "Invalid query parameter" });
            return;
        }
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(400).json({ message: "Invalid query format" });
        return;
    }

    // check permissions
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

    try {
        const currentRole = await SqlConnection.manager.findOneOrFail(Role, {
            where: { id },
        });

        await SqlConnection.manager.update(
            Role,
            { id },
            {
                name: name ?? currentRole.name,
                department_id: department_id ?? currentRole.department_id,
            }
        );

        await SqlConnection.manager.update(
            Permission,
            { id: currentRole.permission_id },
            { ...permissions }
        );
        res.sendStatus(200);
        return;
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(500).json({ message: "Unable to edit role" });
        return;
    }
});

export default router;
