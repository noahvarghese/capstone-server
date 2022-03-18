import Manual from "@models/manual/manual";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";

const postController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        dbConnection,
    } = req;

    //  1.  Parse args
    let title: string;
    let prevent_delete: boolean, prevent_edit: boolean, published: boolean;

    try {
        const data = getJOpts(req.body, {
            title: { type: "string", required: true },
            prevent_edit: { type: "boolean", required: false },
            prevent_delete: { type: "boolean", required: false },
            published: { type: "boolean", required: false },
        });
        title = data.title as string;
        prevent_edit = data.prevent_edit as boolean;
        prevent_delete = data.prevent_delete as boolean;
        published = data.published as boolean;
    } catch (_e) {
        const { message } = _e as Error;
        res.status(400).send(message);
        return;
    }

    //  2.  Check permissions
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

    await dbConnection.manager.insert(
        Manual,
        new Manual({
            updated_by_user_id: user_id,
            business_id: current_business_id,
            title,
            published,
            prevent_delete,
            prevent_edit,
        })
    );

    res.sendStatus(201);
};

export default postController;
