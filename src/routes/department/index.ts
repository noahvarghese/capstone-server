import Department from "@models/department";
import ManualAssignment from "@models/manual/assignment";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import { Router, Response, Request } from "express";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import validator from "validator";

const router = Router();

export interface DepartmentResponse {
    id: number;
    name: string;
    numMembers: number;
    numRoles: number;
}

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
            "global_crud_department",
            "global_assign_resources_to_department",
            "global_assign_users_to_department",
        ]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    try {
        const returnVal: DepartmentResponse[] = [];

        const departments = await SqlConnection.manager.find(Department, {
            where: { business_id: current_business_id },
        });

        for (const dept of departments) {
            const numMembers = await SqlConnection.createQueryBuilder()
                .select("COUNT(user.id)", "count")
                .from(Department, "d")
                .leftJoin(Role, "r", "r.department_id = d.id")
                .where("d.id = :dept_id", { dept_id: dept.id })
                .leftJoin(UserRole, "ur", "ur.role_id = r.id")
                .leftJoin(User, "user", "user.id = ur.user_id")
                .getRawMany();

            const numRoles = await SqlConnection.createQueryBuilder()
                .select("COUNT(r.id)", "count")
                .from(Department, "d")
                .leftJoin(Role, "r", "r.department_id = d.id")
                .where("d.id = :dept_id", { dept_id: dept.id })
                .getRawMany();

            returnVal.push({
                id: dept.id,
                name: dept.name,
                numMembers: numMembers[0].count,
                numRoles: numRoles[0].count,
            });
        }

        res.status(200).json(returnVal);
        return;
    } catch (_e) {
        const e = _e as Error;
        Logs.Error(e.message);
        res.status(500).json({ message: "Unable to get departments" });
        return;
    }
});

router.post("/", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
        SqlConnection,
        body: { name, prevent_delete, prevent_edit },
    } = req;

    //check permissions
    const hasPermission = await Permission.checkPermission(
        Number(user_id),
        Number(current_business_id),
        SqlConnection,
        ["global_crud_department"]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    // check department exists
    const count = await SqlConnection.manager.count(Department, {
        where: { name, business_id: current_business_id },
    });

    if (count > 0) {
        res.status(405).json({ message: "department exists" });
        return;
    }

    try {
        const result = await SqlConnection.manager.insert(
            Department,
            new Department({
                name,
                prevent_delete,
                prevent_edit,
                updated_by_user_id: user_id,
                business_id: current_business_id,
            })
        );

        if (result.identifiers.length === 1) {
            res.sendStatus(201);
            return;
        }
    } catch (_e) {
        const e = _e as Error;
        Logs.Error(e.message);
        res.status(500).json({ message: "Error creating department" });
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
        ["global_crud_department"]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    // check if users are joined to department
    try {
        const numUsersInDepartment = await SqlConnection.createQueryBuilder()
            .select("COUNT(ur.id)")
            .from(UserRole, "ur")
            .leftJoin(Role, "r", "r.id = ur.role_id")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .where("d.id IN(:...ids)", { ids })
            .getCount();

        if (numUsersInDepartment > 0) {
            const message = `There are users associated with ${
                ids.length > 1
                    ? "at least one of these departments,"
                    : "this department,"
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
            message: "Unable to count user assignments to department",
        });
        return;
    }

    // remove non user associations
    try {
        await SqlConnection.transaction(
            async (transactionManager: EntityManager) => {
                try {
                    await transactionManager
                        .createQueryBuilder()
                        .delete()
                        .from(ManualAssignment)
                        .where("department_id IN (:...ids)", { ids })
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
                    .where("r.department_id IN (:...ids)", { ids })
                    .getMany();

                try {
                    await transactionManager
                        .createQueryBuilder()
                        .delete()
                        .from(Role)
                        .where("department_id IN (:...ids)", { ids })
                        .execute();
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

                try {
                    await transactionManager.delete(Department, ids);
                } catch (_e) {
                    const { message } = _e as Error;
                    Logs.Error(message);
                    throw new Error("Unable to delete departments");
                }
            }
        );

        res.sendStatus(200);
        return;
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(500).json({
            message,
        });
        return;
    }
});

router.put("/:id", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
        SqlConnection,
        params: { id: queryId },
        body: { name },
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
        ["global_crud_department"]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    try {
        await SqlConnection.manager.update(Department, { id }, { name });
        res.sendStatus(200);
        return;
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(500).json({ message: "Unable to edit department" });
    }
});

export default router;
