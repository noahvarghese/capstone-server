import Department from "@models/department";
import Role from "@models/role";
import User from "@models/user/user";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        dbConnection,
        params: { id },
    } = req;

    if (!isNumber(id)) {
        res.sendStatus(400);
        return;
    }

    try {
        const [isAdmin, isManager] = await Promise.all([
            User.isAdmin(
                dbConnection,
                current_business_id ?? NaN,
                user_id ?? NaN
            ),
            User.isManager(
                dbConnection,
                current_business_id ?? NaN,
                user_id ?? NaN
            ),
        ]);

        if (!(isAdmin || isManager)) {
            res.sendStatus(403);
            return;
        }
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
        return;
    }

    try {
        await dbConnection.manager.findOneOrFail(Department, {
            where: { business_id: current_business_id, id },
        });
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(400);
        return;
    }

    const roles = await dbConnection
        .createQueryBuilder()
        .select("r.id", "id")
        .addSelect("r.name", "name")
        .addSelect(
            "(SELECT COUNT(DISTINCT(ur.user_id)) FROM user_role ur JOIN role r2 ON r2.id = ur.role_id WHERE r2.id = r.id)",
            "num_members"
        )
        .from(Role, "r")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("d.id = :id", { id })
        .getRawMany();

    res.status(200).send(roles);
};

export default getController;
