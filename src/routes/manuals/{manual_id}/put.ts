import Department from "@models/department";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Role from "@models/role";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";

const putController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { manual_id: id },
        dbConnection,
    } = req;

    //  1.  Parse args
    let title: string,
        prevent_edit: boolean,
        prevent_delete: boolean,
        published: boolean;

    try {
        const data = getJOpts(req.body, {
            title: { type: "string", required: false },
            prevent_delete: { type: "boolean", required: false },
            prevent_edit: { type: "boolean", required: false },
            published: { type: "boolean", required: false },
        });

        title = data.title as string;
        prevent_delete = data.prevent_delete as boolean;
        prevent_edit = data.prevent_edit as boolean;
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

    const manual = await dbConnection
        .createQueryBuilder()
        .select("m")
        .from(Manual, "m")
        .leftJoin(ManualAssignment, "ma", "m.id = ma.manual_id")
        .leftJoin(Role, "r", "r.id = ma.role_id")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("d.business_id = :current_business_id", { current_business_id })
        .andWhere("m.id = :id", { id })
        .getOne();

    if (!manual) {
        res.sendStatus(400);
        return;
    } else if (
        manual.prevent_edit &&
        (prevent_edit === undefined || manual.prevent_edit === prevent_edit)
    ) {
        res.sendStatus(405);
        return;
    }

    //  3.  Create new manual that is not published by default
    await dbConnection.manager.update(Manual, id, {
        updated_by_user_id: user_id,
        title: title ?? manual.title,
        published: published ?? manual.published,
        prevent_delete: prevent_delete ?? manual.prevent_delete,
        prevent_edit: prevent_edit ?? manual.prevent_edit,
    });

    res.sendStatus(200);
};

export default putController;
