import Department from "@models/department";
import Membership from "@models/membership";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { Request, Response } from "express";
import { Member } from "../get";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        dbConnection,
        params: { user_id: id },
    } = req;

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, user_id!),
    ]);

    if (!(isAdmin || isManager)) {
        if (Number(id) !== user_id) {
            res.sendStatus(403);
            return;
        }
    }

    const result = await dbConnection
        .createQueryBuilder()
        .select("u")
        .addSelect("m.accepted")
        .distinct(true)
        .from(User, "u")
        .leftJoin(Membership, "m", "m.user_id = u.id")
        .leftJoin(UserRole, "ur", "ur.user_id = u.id")
        .leftJoin(Role, "r", "ur.role_id = r.id")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("m.business_id = :business_id", {
            business_id: current_business_id,
        })
        .andWhere("u.id = :id", { id })
        .getRawOne<{
            u_id: number;
            u_first_name: string;
            u_last_name: string;
            u_email: string;
            u_phone: string;
            u_birthday?: Date;
            m_accepted: 0 | 1;
        }>();

    if (!result) {
        res.sendStatus(400);
        return;
    }

    const member: Member = {
        id: result.u_id,
        first_name: result.u_first_name,
        last_name: result.u_last_name,
        email: result.u_email,
        phone: result.u_phone,
        birthday: result.u_birthday,
        accepted: result.m_accepted === 1,
        roles: (
            await dbConnection
                .createQueryBuilder()
                .select(
                    "r.id AS role_id, r.name AS role_name, d.id AS department_id, d.name AS department_name"
                )
                .from(UserRole, "ur")
                .leftJoin(Role, "r", "r.id = ur.role_id")
                .leftJoin(Department, "d", "d.id = r.department_id")
                .where("ur.user_id = :user_id", { user_id: result.u_id })
                .getRawMany<{
                    role_id: number;
                    role_name: string;
                    department_id: number;
                    department_name: string;
                }>()
        ).map((r) => ({
            id: r.role_id,
            name: r.role_name,
            department: {
                id: r.department_id,
                name: r.department_name,
            },
        })),
    };

    res.status(200).send(member);
    return;
};

export default getController;
