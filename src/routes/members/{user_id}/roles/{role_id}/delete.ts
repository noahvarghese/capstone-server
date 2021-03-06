import Department from "@models/department";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { Request, Response } from "express";

const deleteController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id: business_id },
        params: { user_id: id, role_id },
        dbConnection,
    } = req;

    if (Number(id) === user_id) {
        res.sendStatus(405);
        return;
    }

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, business_id!, user_id!),
    ]);

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

    // check that user role is a part of the business
    const ur = await dbConnection
        .createQueryBuilder()
        .select("ur")
        .from(UserRole, "ur")
        .leftJoin(Role, "r", "r.id = ur.role_id")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("ur.user_id = :id", { id })
        .andWhere("ur.role_id = :role_id", { role_id })
        .andWhere("d.business_id = :business_id", { business_id })
        .getOne();

    if (!ur) {
        res.sendStatus(400);
        return;
    }

    if (ur.prevent_delete) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.delete(UserRole, {
        user_id: Number(id),
        role_id: Number(role_id),
    });

    res.sendStatus(200);
};

export default deleteController;
