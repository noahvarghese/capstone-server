import Department from "@models/department";
import ManualAssignment from "@models/manual/assignment";
import Permission, {
    EmptyPermissionAttributes,
    PermissionAttributes,
} from "@models/permission";
import Role from "@models/role";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import isSortFieldFactory from "@util/sortFieldFactory";
import { Router, Request, Response } from "express";
import { Brackets, EntityManager, WhereExpressionBuilder } from "typeorm";
import validator from "validator";
import memberAssignmentRouter from "./member_assignment";

const router = Router();

router.use("/member_assignment", memberAssignmentRouter);
// router.use(async (req: Request, res: Response, next: NextFunction) => {});

export interface RoleResponse {
    id: number;
    name: string;
    department: {
        id: number;
        name: string;
    };
    permissions: PermissionAttributes & Pick<Permission, "id">;
}

router.get("/:id", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
        SqlConnection,
        params: { id },
    } = req;

    if (!validator.isNumeric(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }

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

    const role: RoleResponse = {
        id: Number(id),
        name: "",
        department: {
            id: 0,
            name: "",
        },
        permissions: { ...EmptyPermissionAttributes(), id: 0 },
    };

    try {
        const roleModel = await SqlConnection.manager.findOneOrFail(Role, {
            where: { id },
        });

        role.name = roleModel.name;
        role.department.id = roleModel.department_id;
        role.permissions.id = roleModel.permission_id;
    } catch (_e) {
        res.status(400).json({ message: "Invalid role" });
        return;
    }

    try {
        const departmentModel = await SqlConnection.manager.findOneOrFail(
            Department,
            { where: { id: role.department.id } }
        );
        role.department.name = departmentModel.name;
    } catch (_e) {
        res.status(400).json({ message: "Invalid department id" });
    }

    try {
        const permissionModel = await SqlConnection.manager.findOneOrFail(
            Permission,
            { where: { id: role.permissions.id } }
        );
        role.permissions = {
            ...permissionModel,
        };
    } catch (_e) {
        res.status(400).json({ message: "Invalid permission id" });
        return;
    }

    res.status(200).json(role);
});

router.get("/", async (req: Request, res: Response) => {
    const {
        query,
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

    // Validate query items
    const limit =
        isNaN(Number(query.limit)) || Number(query.limit) < 1
            ? 50
            : Number(query.limit);
    const page =
        isNaN(Number(query.page)) || Number(query.page) < 1
            ? 1
            : Number(query.page);

    const { sortField, sortOrder, search, filterIds } = req.query;

    if (
        !["ASC", "DESC", "", undefined].includes(
            sortOrder as string | undefined
        )
    ) {
        res.status(400).json({ message: "Unknown option for sort order" });
        return;
    }

    const isSortField = isSortFieldFactory(["department", "role"]);

    if (sortField !== undefined && !isSortField(sortField as string)) {
        res.status(400).json({
            message: "Invalid field to sort by " + sortField,
        });
        return;
    }

    const sqlizedSearchItem = `%${search}%`;

    const filterArray = JSON.parse(filterIds ? (filterIds as string) : "{}");
    const filter = Array.isArray(filterArray);

    try {
        const returnVal: {
            id: number;
            name: string;
            department: { id: number; name: string };
        }[] = [];

        let roleQuery = SqlConnection.createQueryBuilder()
            .select("r")
            .from(Role, "r")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .where("d.business_id = :business_id", {
                business_id: current_business_id,
            });

        if (search) {
            roleQuery = roleQuery.andWhere(
                new Brackets((qb: WhereExpressionBuilder) => {
                    qb.where("r.name like :role_name", {
                        role_name: sqlizedSearchItem,
                    }).orWhere("d.name like :department_name", {
                        department_name: sqlizedSearchItem,
                    });
                })
            );
        }

        if (filter) {
            roleQuery = roleQuery.andWhere("d.id IN (:...ids)", {
                ids: filterArray,
            });
        }

        const roles = await roleQuery
            .orderBy(
                sortField === "department"
                    ? "d.name"
                    : sortField === "role"
                    ? "r.name"
                    : "r.created_on",
                (sortOrder as "ASC" | "DESC") ?? "DESC"
            )
            .limit(limit)
            .offset(page * limit - limit)
            .getMany();

        for (const role of roles) {
            const department = await SqlConnection.manager.findOneOrFail(
                Department,
                {
                    where: { id: role.department_id },
                }
            );

            returnVal.push({
                id: role.id,
                name: role.name,
                department: {
                    name: department.name,
                    id: department.id,
                },
            });
        }

        res.status(200).json(returnVal);
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
        await SqlConnection.transaction(
            async (transactionManager: EntityManager) => {
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
            }
        );

        res.sendStatus(200);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(500).json({ message: "Unable to delete role" });
    }
});

router.put("/:id", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
        SqlConnection,
        params: { id: queryId },
        body: { name, department_id, permissions },
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

        if (permissions) {
            await SqlConnection.manager.update(
                Permission,
                { id: currentRole.permission_id },
                { ...permissions }
            );
        }
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
