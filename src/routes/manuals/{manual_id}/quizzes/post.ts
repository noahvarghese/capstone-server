import Manual from "@models/manual/manual";
import Quiz from "@models/quiz/quiz";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";

const postController = async (req: Request, res: Response): Promise<void> => {
    const {
        dbConnection,
        session: { user_id, current_business_id },
        params: { manual_id },
    } = req;

    let title: string;
    let max_attempts: number;
    let prevent_delete: boolean;
    let prevent_edit: boolean;
    let published: boolean;

    try {
        const data = getJOpts(req.body, {
            title: { type: "string", required: true },
            max_attempts: { type: "number", required: true },
            published: { type: "boolean", required: false },
            prevent_delete: { type: "boolean", required: true },
            prevent_edit: { type: "boolean", required: true },
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

    const m = await dbConnection.manager.findOne(Manual, {
        where: { id: manual_id, business_id: current_business_id },
    });

    if (!m) {
        res.sendStatus(400);
        return;
    }

    await dbConnection.manager.insert(
        Quiz,
        new Quiz({
            manual_id: Number(manual_id),
            updated_by_user_id: user_id,
            title,
            max_attempts,
            prevent_delete,
            prevent_edit,
            published: published ?? false,
        })
    );

    res.sendStatus(201);
};

export default postController;
