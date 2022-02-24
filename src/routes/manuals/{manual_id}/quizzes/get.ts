import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Quiz from "@models/quiz/quiz";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        dbConnection,
        session: { user_id, current_business_id },
        params: { manual_id },
    } = req;

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, user_id!),
    ]);

    let query = dbConnection
        .createQueryBuilder()
        .select("q")
        .from(Quiz, "q")
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
        .leftJoin(UserRole, "ur", "ur.role_id = ma.role_id")
        .where("m.business_id = :current_business_id", { current_business_id })
        .andWhere("m.id = :manual_id", { manual_id });

    if (!(isAdmin || isManager)) {
        const isAssigned = await query
            .andWhere("ur.user_id = :user_id", { user_id })
            .getOne();

        if (!isAssigned) {
            res.sendStatus(403);
            return;
        }

        query = query
            .andWhere("ur.user_id = :user_id", { user_id })
            .andWhere("q.published = :qPublished", {
                qPublished: true,
            })
            .andWhere("m.published = :mPublished", { mPublished: true });
    }

    const result = await query.getMany();

    res.status(200).send(result);
};

export default getController;
