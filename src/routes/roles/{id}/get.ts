import Department from "@models/department";
import Role, { AccessKey } from "@models/role";
import User from "@models/user/user";
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

    const role = await dbConnection
        .createQueryBuilder()
        .select("r.id", "id")
        .addSelect("r.name", "name")
        .addSelect("r.access", "access")
        .addSelect("d.name", "department_name")
        .addSelect("d.id", "department_id")
        .addSelect(
            "(SELECT COUNT(DISTINCT(ur.user_id)) FROM user_role ur JOIN role r2 ON r2.id = ur.role_id WHERE r2.id = r.id)",
            "num_members"
        )
        .from(Role, "r")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("d.business_id = :current_business_id", { current_business_id })
        .andWhere("r.id = :id", { id })
        .getRawOne<{
            id: number;
            name: string;
            access: AccessKey;
            department_name: string;
            department_id: number;
            num_members: number;
        }>();

    res.status(200).send(
        role
            ? {
                  id: role.id,
                  name: role.name,
                  access: role.access,
                  department: {
                      id: role.department_id,
                      name: role.department_name,
                  },
                  num_members: role.num_members,
              }
            : {}
    );
    return;
};

export default getController;
