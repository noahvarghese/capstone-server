import Content from "@models/manual/content/content";
import ContentRead from "@models/manual/content/read";
import Manual from "@models/manual/manual";
import ManualSection from "@models/manual/section";
import User from "@models/user/user";
import { Request, Response } from "express";

const postController = async (req: Request, res: Response): Promise<void> => {
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

    if (isAdmin || isManager) {
        res.sendStatus(403);
        return;
    }

    const m = await dbConnection
        .createQueryBuilder()
        .select("m")
        .from(Manual, "m")
        .leftJoin(ManualSection, "ms", "ms.manual_id = m.id")
        .leftJoin(Content, "c", "c.manual_section_id = ms.id")
        .where("m.published = :published", { published: true })
        .andWhere("m.business_id = :current_business_id", {
            current_business_id,
        })
        .andWhere("c.id = :id", { id })
        .getRawOne();

    if (!m) {
        res.sendStatus(400);
        return;
    }

    await dbConnection.manager.insert(
        ContentRead,
        new ContentRead({ user_id, content_id: Number(id) })
    );

    res.sendStatus(200);
};

export default postController;
