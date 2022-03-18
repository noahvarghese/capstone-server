import Department from "@models/department";
import Membership from "@models/membership";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

const postController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id: business_id },
        params: { user_id: id, role_id },
        dbConnection,
    } = req;

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, business_id!, user_id!),
    ]);

    if (Number(id) === user_id) {
        res.sendStatus(405);
        return;
    }

    const isManagerOfRole = await Role.hasManager(
        dbConnection,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        user_id!,
        Number(role_id)
    );

    if (!(isAdmin || isManager) || (isManager && !isManagerOfRole)) {
        res.sendStatus(403);
        return;
    }

    const [member, role] = await Promise.all([
        // check that user is a member of the business
        dbConnection.manager.findOne(Membership, {
            where: { user_id: id, business_id },
        }),
        // check that role is a member of the business
        dbConnection
            .createQueryBuilder()
            .select("r")
            .from(Role, "r")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .where("r.id = :role_id", { role_id })
            .andWhere("d.business_id = :business_id", { business_id })
            .getOne(),
    ]);

    if (!role || !member) {
        Logs.Error(
            `${!role ? "Role" : "User"} ${
                !role ? role_id : id
            } not a part of the business: ${business_id}`
        );
        res.sendStatus(400);
        return;
    }

    await dbConnection.manager.insert(
        UserRole,
        new UserRole({
            updated_by_user_id: user_id,
            user_id: Number(id),
            role_id: Number(role_id),
        })
    );

    res.sendStatus(201);
};

export default postController;
