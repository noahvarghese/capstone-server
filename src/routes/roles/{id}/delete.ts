import Department from "@models/department";
import Role from "@models/role";
import User from "@models/user/user";
import { Request, Response } from "express";

const deleteController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { current_business_id, user_id },
        params: { id },
        dbConnection,
    } = req;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!(await User.isAdmin(dbConnection, current_business_id!, user_id!))) {
        res.sendStatus(403);
        return;
    }

    const role = await dbConnection
        .createQueryBuilder()
        .select("r")
        .from(Role, "r")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("r.id = :id", { id })
        .andWhere("d.business_id = :current_business_id", {
            current_business_id,
        })
        .getOne();

    if (!role) {
        res.sendStatus(400);
        return;
    } else if (role.prevent_delete) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.delete(Role, {
        id,
    });

    res.sendStatus(200);
};

export default deleteController;
