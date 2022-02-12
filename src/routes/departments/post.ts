import Department from "@models/department";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";

const postController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { current_business_id, user_id },
        dbConnection,
    } = req;

    let name = "";

    try {
        const data = getJOpts(req.body, {
            name: { type: "string", required: true },
        });
        name = data.name as string;
    } catch (_e) {
        const { message } = _e as Error;
        res.status(400).send(message);
        return;
    }

    if (!dbConnection || !dbConnection.isConnected) {
        res.sendStatus(500);
        return;
    }

    const isAdmin = await User.isAdmin(
        dbConnection,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        current_business_id!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        user_id!
    );

    if (!isAdmin) {
        res.sendStatus(403);
        return;
    }

    await dbConnection.manager.insert(
        Department,
        new Department({
            name,
            updated_by_user_id: user_id,
            business_id: current_business_id,
        })
    );

    res.sendStatus(201);
};

export default postController;
