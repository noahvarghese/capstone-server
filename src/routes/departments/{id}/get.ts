import Department from "@models/department";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
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

    const result = await dbConnection
        .createQueryBuilder()
        .select("d.name", "name")
        .addSelect("d.id", "id")
        .addSelect(
            "(SELECT COUNT(DISTINCT(ur.user_id)) FROM user_role ur JOIN role r ON r.id = ur.role_id JOIN department d2 ON d2.id = r.department_id WHERE r.access = 'MANAGER' AND d2.id = d.id)",
            "num_managers"
        )
        .addSelect(
            "(SELECT COUNT(DISTINCT(ur.user_id)) FROM user_role ur JOIN role r ON r.id = ur.role_id JOIN department d2 ON d2.id = r.department_id WHERE d2.id = d.id)",
            "num_members"
        )
        .addSelect(
            "(SELECT COUNT(DISTINCT(r.id)) FROM role r JOIN department d2 ON d2.id = r.department_id WHERE d2.id = d.id)",
            "num_roles"
        )
        .from(Department, "d")
        .leftJoin(Role, "r", "r.department_id = d.id")
        .leftJoin(UserRole, "ur", "ur.role_id = r.id")
        .where("d.business_id = :current_business_id", {
            current_business_id,
        })
        .andWhere("d.id = :id", { id })
        .getRawOne();

    res.status(200).send(result);
    return;
};

export default getController;
