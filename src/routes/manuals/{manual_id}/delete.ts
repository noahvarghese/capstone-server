import Department from "@models/department";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Role from "@models/role";
import User from "@models/user/user";
import { Request, Response } from "express";

const deleteController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { manual_id: id },
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

    // TODO: If user is a manager, check that user the manual is assigned to the management role

    const manual = await dbConnection
        .createQueryBuilder()
        .select("m")
        .from(Manual, "m")
        .leftJoin(ManualAssignment, "ma", "m.id = ma.manual_id")
        .leftJoin(Role, "r", "r.id = ma.role_id")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("d.business_id = :current_business_id", { current_business_id })
        .andWhere("m.id = :id", { id })
        .getOne();

    if (!manual) {
        res.sendStatus(400);
        return;
    } else if (manual.prevent_delete) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.delete(Manual, id);

    res.sendStatus(200);
};

export default deleteController;
