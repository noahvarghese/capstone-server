import Department from "@models/department";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
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

    if (!dbConnection || !dbConnection.isConnected) {
        res.sendStatus(500);
        return;
    }

    if (id !== user_id) {
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
    }

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
};

export default getController;
