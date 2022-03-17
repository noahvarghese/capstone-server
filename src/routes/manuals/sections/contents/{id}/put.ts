import Manual from "@models/manual/manual";
import Content from "@models/manual/content/content";
import ManualSection from "@models/manual/section";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";

const putController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { id },
        dbConnection,
    } = req;

    let title: string;
    let content: string;

    try {
        const data = getJOpts(req.body, {
            title: { type: "string", required: false },
            content: { type: "object", required: false },
        });

        title = data.title as string;
        content = data.content ? JSON.stringify(data.content) : "";
    } catch (_e) {
        const { message } = _e as Error;
        res.status(400).send(message);
        return;
    }

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

    const manual = await dbConnection
        .createQueryBuilder()
        .select("m")
        .from(Manual, "m")
        .leftJoin(ManualSection, "ms", "ms.manual_id = m.id")
        .leftJoin(Content, "c", "c.manual_section_id = ms.id")
        .where("m.business_id = :current_business_id", { current_business_id })
        .andWhere("c.id = :id", { id })
        .getOne();

    if (!manual) {
        res.sendStatus(400);
        return;
    }

    if (manual.prevent_edit) {
        res.sendStatus(405);
        return;
    }

    const prevContent = await dbConnection.manager.findOne(Content, id);

    if (!prevContent) {
        res.sendStatus(400);
        return;
    }

    await dbConnection.manager.update(Content, id, {
        updated_by_user_id: user_id,
        title: title ?? prevContent.title,
        content: content ?? prevContent.content,
    });

    res.sendStatus(200);
};

export default putController;
