import Department from "@models/department";
import Membership from "@models/membership";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import { Router, Request, Response } from "express";
import inviteRoute from "./invite";

const router = Router();

router.use("/invite", inviteRoute);

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
        SqlConnection,
    } = req;

    if (Number(id) !== Number(user_id)) {
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
    }

    try {
        const { email, first_name, last_name, phone, birthday } =
            await SqlConnection.manager.findOneOrFail(User, {
                where: { id },
            });

        const roles = await SqlConnection.createQueryBuilder()
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

const sortFields = (fields: readonly string[]) => {
    type FieldType = typeof fields[number];
    return (val: string): val is FieldType => {
        Logs.Debug(val);
        return typeof val === "string" && fields.includes(val);
    };
};

// get all users that are associated with business
router.get("/", async (req: Request, res: Response) => {
    const {
        query,
        SqlConnection: connection,
        session: { current_business_id, user_id },
    } = req;

    //check permissions
    const hasPermission = await Permission.checkPermission(
        Number(user_id),
        Number(current_business_id),
        connection,
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

    const limit = isNaN(Number(query.limit)) ? 50 : Number(query.limit);
    const page = isNaN(Number(query.page)) ? 1 : Number(query.page);

    const { sortField, sortOrder } = req.query;

    if (
        !["ASC", "DESC", "", undefined].includes(
            sortOrder as string | undefined
        )
    ) {
        res.status(400).json({ message: "Unknown option for sort order" });
        return;
    }

    const isSortField = sortFields([
        "birthday",
        "first_name",
        "last_name",
        "email",
        "phone",
    ]);

    if (sortField !== undefined && !isSortField(sortField as string)) {
        res.status(400).json({ message: "Invalid field to sort by" });
        return;
    }

    const users: { u_id: number }[] = await connection
        .createQueryBuilder()
        .select("u.id")
        .from(User, "u")
        .where("m.business_id = :business_id", {
            business_id: current_business_id,
        })
        .leftJoin(Membership, "m", "m.user_id = u.id")
        .orderBy(
            sortField ? `u.${sortField}` : "u.created_on",
            (sortOrder as "ASC" | "DESC") ?? "DESC"
        )
        .limit(limit)
        .offset(page * limit - limit)
        .getRawMany();

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
        Logs.Debug(userInfo);

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

export default router;
