import Manual from "@models/manual/manual";
import Policy from "@models/manual/policy";
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

    const manual = await dbConnection
        .createQueryBuilder()
        .select("m")
        .from(Manual, "m")
        .leftJoin(ManualSection, "ms", "ms.manual_id = m.id")
        .leftJoin(Policy, "p", "p.manual_section_id = ms.id")
        .where("m.business_id = :current_business_id", { current_business_id })
        .andWhere("p.id = :id", { id })
        .getOne();

    if (!manual) {
        res.sendStatus(400);
        return;
    }

    if (manual.prevent_edit) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.update(Policy, id, {
        updated_by_user_id: user_id,
        title: title,
    });

    res.sendStatus(200);
};

export default putController;
