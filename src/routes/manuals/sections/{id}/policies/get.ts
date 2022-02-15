import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Policy from "@models/manual/policy";
import ManualSection from "@models/manual/section";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { id },
        dbConnection,
    } = req;

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, user_id!),
    ]);

    let query = dbConnection
        .createQueryBuilder()
        .select("p.id, p.title")
        .from(Policy, "p")
        .leftJoin(ManualSection, "ms", "ms.id = p.manual_section_id")
        .leftJoin(Manual, "m", "m.id = ms.manual_id")
        .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
        .leftJoin(UserRole, "ur", "ur.role_id = ma.role_id")
        .where("m.business_id = :current_business_id", {
            current_business_id,
        })
        .andWhere("ms.id = :id", { id });

    if (!(isAdmin || isManager)) {
        query = query
            .andWhere("m.published = :published", { published: true })
            .andWhere("ur.user_id = :user_id", { user_id });
    }

    res.status(200).send(
        await query.getRawMany<{ id: number; title: string }>()
    );
    return;
};

export default getController;
