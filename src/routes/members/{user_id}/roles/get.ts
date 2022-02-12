import Department from "@models/department";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        params: { user_id: userId },
        session: { user_id, current_business_id },
        dbConnection,
    } = req;

    const id = Number(userId);

    if (!isNumber(id)) {
        res.sendStatus(400);
        return;
    }

    // despite checking in the middleware, we need to explicitly define these as numbers
    if (!isNumber(user_id) || !isNumber(current_business_id)) {
        res.sendStatus(401);
        return;
    }

    if (id !== user_id) {
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
    }

    if (!dbConnection || !dbConnection.isConnected) {
        res.sendStatus(500);
        return;
    }

    try {
        await dbConnection.manager.findOneOrFail(User, id);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(400);
        return;
    }

    try {
        const result = await dbConnection
            .createQueryBuilder()
            .select("r.id", "id")
            .addSelect("r.name", "name")
            .addSelect("d.name", "department_name")
            .addSelect("d.id", "department_id")
            .from(Role, "r")
            .leftJoin(UserRole, "ur", "ur.role_id = r.id")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .where("d.business_id = :current_business_id", {
                current_business_id,
            })
            .andWhere("ur.user_id = :id", { id })
            .getRawMany<{
                id: number;
                name: string;
                department_id: number;
                department_name: string;
            }>();

        res.status(200).send(
            result.map(({ id, name, ...rest }) => ({
                id,
                name,
                department: {
                    id: rest.department_id,
                    name: rest.department_name,
                },
            }))
        );
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
    }
};

export default getController;
