import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        dbConnection,
        params: { manual_id: id },
    } = req;

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, user_id!),
    ]);

    let query = dbConnection
        .createQueryBuilder()
        .select("m.id, m.title, m.published, m.prevent_delete, m.prevent_edit")
        .from(Manual, "m")
        .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
        .leftJoin(UserRole, "ur", "ur.role_id = ma.role_id")
        .where("m.id = :id", { id });

    if (!(isAdmin || isManager)) {
        query = query
            .andWhere("ur.user_id = :user_id", { user_id })
            .andWhere("m.published = :published", { published: true })
            .andWhere("m.business_id = :current_business_id", {
                current_business_id,
            });
    }

    const manual = await query.getRawOne();
    res.status(200).send(
        manual
            ? {
                  ...manual,
                  prevent_edit: manual.prevent_edit === 1,
                  prevent_delete: manual.prevent_delete === 1,
                  published: manual.published === 1,
              }
            : undefined
    );
};

export default getController;
