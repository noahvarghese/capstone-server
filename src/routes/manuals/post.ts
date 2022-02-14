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

    try {
        const data = getJOpts(req.body, {
            title: { type: "string", required: true },
        });
        title = data.title as string;
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

    //  3.  Create new manual that is not published by default
    await dbConnection.manager.insert(
        Manual,
        new Manual({
            title,
            updated_by_user_id: user_id,
            published: false,
            prevent_delete: false,
            prevent_edit: false,
        })
    );

    res.sendStatus(201);
};

export default postController;
