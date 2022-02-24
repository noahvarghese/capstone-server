import ManualAssignment from "@models/manual/assignment";
import Content from "@models/manual/content/content";
import ContentRead from "@models/manual/content/read";
import Manual from "@models/manual/manual";
import ManualSection from "@models/manual/section";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
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
        .select("u")
        .addSelect("m")
        .from(User, "u")
        .leftJoin(UserRole, "ur", "ur.user_id = u.id")
        .leftJoin(ManualAssignment, "ma", "ma.role_id = ur.role_id")
        .leftJoin(Manual, "m", "m.id = ma.manual_id")
        .leftJoin(ManualSection, "ms", "ms.manual_id = m.id")
        .leftJoin(Content, "c", "c.manual_section_id = ms.id")
        .leftJoin(ContentRead, "cr", "cr.content_id = c.id")
        .where("cr.user_id IS NULL")
        .andWhere("m.published = :published", { published: true })
        .andWhere("m.business_id = :current_business_id", {
            current_business_id,
        })
        .getRawMany<{
            u_id: number;
            u_first_name: string;
            u_last_name: string;
            u_email: string;
            m_title: string;
            m_id: number;
        }>();

    const usersWithUnreadManuals = result.reduce((prev, curr) => {
        const user = prev.find((p) => {
            return p.id === curr.u_id;
        });

        if (!user) {
            prev.push({
                id: curr.u_id,
                first_name: curr.u_first_name,
                last_name: curr.u_last_name,
                email: curr.u_email,
                manuals: [{ id: curr.m_id, title: curr.m_title }],
            });
            return prev;
        }

        user.manuals.push({ id: curr.m_id, title: curr.m_title });
        return prev;
    }, [] as { id: number; first_name: string; last_name: string; email: string; manuals: { id: number; title: string }[] }[]);

    res.status(200).send(usersWithUnreadManuals);
};

export default getController;
