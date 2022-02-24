import Membership from "@models/membership";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { id },
        dbConnection,
    } = req;

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, user_id!),
    ]);

    if (!(isAdmin || isManager)) {
        res.sendStatus(403);
        return;
    }

    const members = await dbConnection
        .createQueryBuilder()
        .select("u.id, u.first_name, u.last_name, u.email, u.phone")
        .from(Role, "r")
        .leftJoin(UserRole, "ur", "ur.role_id = r.id")
        .leftJoin(User, "u", "u.id = ur.user_id")
        .leftJoin(Membership, "m", "m.user_id = u.id")
        .where("m.business_id = :current_business_id", { current_business_id })
        .andWhere("r.id = :id", { id })
        .getRawMany<
            Pick<User, "id" | "first_name" | "last_name" | "email" | "phone">
        >();

    res.status(200).send(members);
    return;
};

export default getController;
