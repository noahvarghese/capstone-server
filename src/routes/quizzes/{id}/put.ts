import Manual from "@models/manual/manual";
import Quiz from "@models/quiz/quiz";
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
    let max_attempts: number;
    let prevent_delete: boolean;
    let prevent_edit: boolean;
    let published: boolean;

    try {
        const data = getJOpts(req.body, {
            title: { type: "string", required: false },
            max_attempts: { type: "number", required: false },
            published: { type: "boolean", required: false },
            prevent_delete: { type: "boolean", required: false },
            prevent_edit: { type: "boolean", required: false },
        });

        title = data.title as string;
        max_attempts = data.max_attempts as number;
        prevent_delete = data.prevent_delete as boolean;
        prevent_edit = data.prevent_edit as boolean;
        published = data.published as boolean;
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

    const q = await dbConnection
        .createQueryBuilder()
        .select("q")
        .from(Quiz, "q")
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .where("q.id = :id", { id })
        .andWhere("m.business_id = :business_id", {
            business_id: current_business_id,
        })
        .getOne();

    if (!q) {
        res.sendStatus(400);
        return;
    } else if (
        q.prevent_edit &&
        (prevent_edit === undefined || q.prevent_edit === prevent_edit)
    ) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.update(Quiz, id, {
        updated_by_user_id: user_id,
        max_attempts: max_attempts ?? q.max_attempts,
        prevent_delete: prevent_delete ?? q.prevent_delete,
        prevent_edit: prevent_edit ?? q.prevent_edit,
        published: published ?? q.published,
        title: title ?? q.title,
    });

    res.sendStatus(200);
};

export default putController;
