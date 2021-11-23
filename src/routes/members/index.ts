import Department from "@models/department";
import Membership from "@models/membership";
import MembershipRequest from "@models/membership_request";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import { Router, Request, Response } from "express";
import inviteRoute from "./invite";

const router = Router();

router.use("/invite", inviteRoute);

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

// get all users that are associated with business
router.get("/", async (req: Request, res: Response) => {
    const {
        SqlConnection: connection,
        session: { current_business_id },
    } = req;

    const limit = isNaN(Number(req.query.limit)) ? 50 : Number(req.query.limit);
    const page = isNaN(Number(req.query.page)) ? 1 : Number(req.query.page);

    const { sortField, sortOrder } = req.query;

    const result = await connection
        .createQueryBuilder()
        .select("u")
        .from(User, "u")
        .leftJoin(Membership, "m", "m.user_id = u.id")
        .leftJoin(MembershipRequest, "mr", "mr.user_id = u.id")
        .where("m.business_id = :m_business_id", {
            m_business_id: current_business_id,
        })
        .orWhere("mr.business_id = :mr_business_id", {
            mr_business_id: current_business_id,
        })
        .orderBy(
            sortField ? `u.${sortField}` : "u.created_on",
            (sortOrder as "ASC" | "DESC") ?? "DESC"
        )
        .limit(limit)
        .offset(page * limit - limit)
        .getMany();

    res.status(200).json({
        data: result.map((u: User) => ({
            ...u,
            name: (u.first_name + " " + u.last_name).trim(),
            first_name: undefined,
            last_name: undefined,
            password: undefined,
            token: undefined,
            token_expiry: undefined,
            created_on: undefined,
            updated_on: undefined,
            deleted_on: undefined,
            address: undefined,
            city: undefined,
            postal_code: undefined,
            province: undefined,
            country: undefined,
        })),
    });
});

export default router;
