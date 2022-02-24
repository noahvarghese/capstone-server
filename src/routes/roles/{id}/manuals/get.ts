import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import User from "@models/user/user";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        params: { id },
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
        .select("m.id, m.title, m.published, m.prevent_edit, m.prevent_delete")
        .from(Manual, "m")
        .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
        .where("ma.role_id = :id", { id })
        .andWhere("m.business_id = :current_business_id", {
            current_business_id,
        })
        .getRawMany<{
            id: number;
            title: string;
            published: boolean;
            prevent_edit: boolean;
            prevent_delete: boolean;
        }>();

    res.status(200).send(result);
};

export default getController;
