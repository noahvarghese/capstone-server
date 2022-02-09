import Department from "@models/department";
import Membership from "@models/membership";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import isSortFieldFactory from "@util/sortFieldFactory";
import { isPhone } from "@util/formats";
import { Router, Request, Response } from "express";
import { Brackets, WhereExpressionBuilder } from "typeorm";
import validator from "validator";
import roleAssignmentRouter from "./role_assignment";
import inviteRouter from "./invite";
import Logs from "@noahvarghese/logger";

const router = Router();

router.use("/invite", inviteRouter);
router.use("/role_assignment", roleAssignmentRouter);

export interface ReadMembers {
    user: {
        first_name: string;
        last_name: string;
        email: string;
        birthday?: Date | string | null;
        phone: string;
        id: number;
    };
    roles: {
        default: boolean;
        id: number;
        name: string;
        department: {
            id: number;
            name: string;
        };
    }[];
}

router.get("/:id", async (req: Request, res: Response) => {
    const {
        params: { id },
        session: { current_business_id, user_id },
        dbConnection,
    } = req;

    if (Number(id) !== Number(user_id)) {
        //check permissions
        const hasPermission = await Permission.hasPermission(
            Number(user_id),
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
    }

    try {
        const { email, first_name, last_name, phone, birthday } =
            await dbConnection.manager.findOneOrFail(User, {
                where: { id },
            });

        const roles = await dbConnection
            .createQueryBuilder()
            .select([
                "r.id",
                "ur.primary_role_for_user",
                "r.name",
                "d.id",
                "d.name",
            ])
            .from(UserRole, "ur")
            .where("ur.user_id = :user_id", { user_id: id })
            .andWhere("d.business_id = :business_id", {
                business_id: current_business_id,
            })
            .innerJoin(Role, "r", "r.id = ur.role_id")
            .innerJoin(Department, "d", "d.id = r.department_id")
            .getRawMany();

        res.status(200).json({
            user: {
                first_name,
                last_name,
                email,
                phone,
                birthday,
                id: Number(id),
            },
            roles: roles.map(
                (r: {
                    ur_primary_role_for_user: number;
                    r_id: number;
                    r_name: string;
                    d_id: number;
                    d_name: string;
                }) => ({
                    default: r.ur_primary_role_for_user === 1,
                    id: r.r_id,
                    name: r.r_name,
                    department: {
                        id: r.d_id,
                        name: r.d_name,
                    },
                })
            ),
        });
    } catch (_e) {
        const e = _e as Error;
        Logs.Error(e.message);
        res.status(400).json({ message: "Bad id" });
    }
});

// get all users that are associated with business
router.get("/", async (req: Request, res: Response) => {
    const {
        query,
        dbConnection: connection,
        session: { current_business_id, user_id },
    } = req;

    //check permissions
    const hasPermission = await Permission.hasPermission(
        Number(user_id),
        Number(current_business_id),
        connection,
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

    // Validate query items
    const limit =
        isNaN(Number(query.limit)) || Number(query.limit) < 1
            ? 50
            : Number(query.limit);
    const page =
        isNaN(Number(query.page)) || Number(query.page) < 1
            ? 1
            : Number(query.page);

    const { sortField, sortOrder, search, filterField, filterIds } = req.query;

    if (
        !["ASC", "DESC", "", undefined].includes(
            sortOrder as string | undefined
        )
    ) {
        res.status(400).json({ message: "Unknown option for sort order" });
        return;
    }

    const isSortField = isSortFieldFactory([
        "birthday",
        "first_name",
        "last_name",
        "email",
        "phone",
    ]);

    if (sortField !== undefined && !isSortField(sortField as string)) {
        res.status(400).json({
            message: "Invalid field to sort by " + sortField,
        });
        return;
    }

    const sqlizedSearchItem = `%${search}%`;

    const filterArray = JSON.parse(filterIds ? (filterIds as string) : "{}");
    const filter = Array.isArray(filterArray) && filterField !== undefined;

    if (filter) {
        if (["department", "role"].includes(filterField as string) === false) {
            res.status(400).json({ message: "Invalid field" });
            return;
        }
    }

    // common start of query
    let userQuery = connection
        .createQueryBuilder()
        .select("u.id")
        .from(User, "u")
        .where("m.business_id = :business_id", {
            business_id: current_business_id,
        });

    // only search portion
    if (search) {
        userQuery = userQuery.andWhere(
            new Brackets((qb: WhereExpressionBuilder) => {
                qb.where("u.birthday like :birthday", {
                    birthday: sqlizedSearchItem,
                })
                    .orWhere("u.first_name like :first_name", {
                        first_name: sqlizedSearchItem,
                    })
                    .orWhere("u.last_name like :last_name", {
                        last_name: sqlizedSearchItem,
                    })
                    .orWhere("u.email like :email", {
                        email: sqlizedSearchItem,
                    })
                    .orWhere("u.phone like :phone", {
                        phone: sqlizedSearchItem,
                    })
                    .orWhere("r.name like :role", { role: sqlizedSearchItem })
                    .orWhere("d.name like :department", {
                        department: sqlizedSearchItem,
                    });
            })
        );
    }

    // only filter portion
    if (filter) {
        userQuery = userQuery.andWhere(
            `${filterField === "department" ? "d.id" : "r.id"} IN (:...ids)`,
            { ids: filterArray }
        );
    }

    // always join
    userQuery = userQuery.leftJoin(Membership, "m", "m.user_id = u.id");

    // only join others if searching or filtering
    if (search || filter) {
        userQuery = userQuery
            .innerJoin(UserRole, "ur", "ur.user_id = u.id")
            .innerJoin(Role, "r", "r.id = ur.role_id")
            .innerJoin(Department, "d", "d.id = r.department_id");
    }

    // apply sorting and pagination
    userQuery = userQuery
        .orderBy(
            sortField ? `u.${sortField}` : "u.created_on",
            (sortOrder as "ASC" | "DESC") ?? "DESC"
        )
        .limit(limit)
        .offset(page * limit - limit);

    const users: { u_id: number }[] = await userQuery.getRawMany();

    // get role and department information
    try {
        const userInfo: ReadMembers[] = await Promise.all(
            users.map(async ({ u_id: id }) => {
                const { first_name, last_name, email, phone, birthday } =
                    await connection.manager.findOneOrFail(User, id);

                const roles = await connection
                    .createQueryBuilder()
                    .select([
                        "r.id",
                        "ur.primary_role_for_user",
                        "r.name",
                        "d.id",
                        "d.name",
                    ])
                    .from(UserRole, "ur")
                    .where("ur.user_id = :user_id", { user_id: id })
                    .andWhere("d.business_id = :business_id", {
                        business_id: current_business_id,
                    })
                    .innerJoin(Role, "r", "r.id = ur.role_id")
                    .innerJoin(Department, "d", "d.id = r.department_id")
                    .getRawMany();

                return {
                    user: {
                        id,
                        first_name,
                        last_name,
                        email,
                        birthday,
                        phone,
                    },
                    roles: roles.map(
                        (r: {
                            ur_primary_role_for_user: number;
                            r_id: number;
                            r_name: string;
                            d_id: number;
                            d_name: string;
                        }) => ({
                            default: r.ur_primary_role_for_user === 1,
                            id: r.r_id,
                            name: r.r_name,
                            department: {
                                id: r.d_id,
                                name: r.d_name,
                            },
                        })
                    ),
                };
            })
        );

        res.status(200).json(userInfo);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(500).json({
            message: "Error retrieving members",
        });
        return;
    }
});

router.delete("/:id", async (req: Request, res: Response) => {
    const {
        dbConnection,
        params: { id: user_id },
        session: { current_business_id, user_id: current_user_id },
    } = req;

    // check for permissions
    const hasPermission = await Permission.hasPermission(
        Number(current_user_id),
        Number(current_business_id),
        dbConnection,
        ["global_crud_users"]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    const membership = await dbConnection.manager.findOne(Membership, {
        where: { user_id, business_id: current_business_id },
    });

    if (!membership) {
        res.sendStatus(200);
        return;
    }

    try {
        dbConnection.manager.delete(Membership, membership);
        res.sendStatus(200);
        return;
    } catch (e) {
        const { message } = e as Error;
        Logs.Error(message);
        res.status(500);
        return;
    }
});

router.put("/:id", async (req: Request, res: Response) => {
    const {
        dbConnection,
        params: { id: user_id },
        session: { current_business_id, user_id: current_user_id },
        body: { first_name, last_name, email, phone, birthday },
    } = req;

    // check for permissions
    if (Number(user_id) !== Number(current_user_id)) {
        const hasPermission = await Permission.hasPermission(
            Number(current_user_id),
            Number(current_business_id),
            dbConnection,
            ["global_crud_users"]
        );

        if (!hasPermission) {
            res.status(403).json({ message: "Insufficient permissions" });
            return;
        }
    }

    if (validator.isEmpty(first_name)) {
        res.status(400).json({
            message: "First name cannot be empty",
            field: "first_name",
        });
        return;
    }

    if (validator.isEmpty(last_name)) {
        res.status(400).json({
            message: "Last name cannot be empty",
            field: "last_name",
        });
        return;
    }

    if (validator.isEmail(email) === false) {
        res.status(400).json({ message: "Invalid email.", field: "email" });
        return;
    }

    if (!isPhone(phone)) {
        res.status(400).json({
            message: "Invalid phone number",
            field: "phone",
        });
        return;
    }

    // Allowed to be blank
    if (birthday && isNaN(Date.parse(birthday))) {
        res.status(400).json({
            message: "Invalid birthday " + birthday,
            field: "birthday",
        });
        return;
    }

    try {
        await dbConnection.manager.update(User, user_id, {
            first_name,
            last_name,
            email,
            phone,
            birthday,
        });
        res.sendStatus(200);
        return;
    } catch (e) {
        const { message } = e as Error;
        Logs.Error(message);
        res.sendStatus(500);
        return;
    }
});

export default router;
