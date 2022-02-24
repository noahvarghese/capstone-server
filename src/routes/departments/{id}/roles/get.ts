import Department from "@models/department";
import Role from "@models/role";
import User from "@models/user/user";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        dbConnection,
        params: { id },
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
