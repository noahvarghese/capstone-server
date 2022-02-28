import Department from "@models/department";
import Role, { AccessKey } from "@models/role";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

const postController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { current_business_id, user_id },
        dbConnection,
    } = req;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!(await User.isAdmin(dbConnection, current_business_id!, user_id!))) {
        res.sendStatus(403);
        return;
    }

    let name = "";
    let department_id = NaN;
    let access: AccessKey = "USER";

    try {
        const data = getJOpts(
            req.body,
            {
                name: { type: "string", required: true },
                department_id: { type: "number", required: true },
                access: { type: "string", required: true, format: "access" },
            },
            {
                access: (v?: unknown) =>
                    ["MANAGER", "ADMIN", "USER"].includes(v as string),
            }
        ) as { name: string; department_id: number; access: AccessKey };
        name = data.name as string;
        department_id = Number(data.department_id);
        access = data.access as AccessKey;
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(400).send(message);
        return;
    }

    if (
        !(await dbConnection.manager.findOneOrFail(Department, {
            id: department_id,
            business_id: current_business_id,
        }))
    ) {
        res.sendStatus(400);
        return;
    }

    await dbConnection.manager.insert(
        Role,
        new Role({ updated_by_user_id: user_id, department_id, name, access })
    );

    res.sendStatus(201);
};

export default postController;
