import Manual from "@models/manual/manual";
import ManualSection from "@models/manual/section";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";

const postController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { manual_id },
        dbConnection,
    } = req;

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

    const manual = await dbConnection.manager.findOne(Manual, {
        where: { id: manual_id, business_id: current_business_id },
    });

    if (!manual) {
        res.sendStatus(400);
        return;
    }

    if (manual.prevent_edit) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.insert(
        ManualSection,
        new ManualSection({
            title,
            updated_by_user_id: user_id,
            manual_id: Number(manual_id),
        })
    );

    res.sendStatus(201);
};

export default postController;
