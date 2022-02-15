import Department from "@models/department";
import ManualAssignment from "@models/manual/assignment";
import Role from "@models/role";
import User from "@models/user/user";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    // TODO: If user is a manager, check that user the manual is assigned to the management role
    const {
        params: { manual_id },
        session: { user_id, current_business_id },
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

    const result = await dbConnection
        .createQueryBuilder()
        .select(
            "r.id, r.name, d.id AS department_id, d.name as department_name"
        )
        .from(Role, "r")
        .leftJoin(ManualAssignment, "ma", "ma.role_id = r.id")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("d.business_id = :current_business_id", { current_business_id })
        .andWhere("ma.manual_id = :manual_id", { manual_id })
        .getRawMany<{
            id: number;
            name: string;
            department_id: number;
            department_name: string;
        }>();

    res.status(200).send(
        result.map((r) => ({
            id: r.id,
            name: r.name,
            department: { id: r.department_id, name: r.department_name },
        }))
    );
};

export default getController;
