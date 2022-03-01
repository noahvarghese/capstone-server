import Department from "@models/department";
import Role, { AccessKey } from "@models/role";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";

const putController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { current_business_id, user_id },
        params: { id },
        dbConnection,
    } = req;

    let name = "";
    let access: AccessKey = "USER";

    try {
        const data = getJOpts(
            req.body,
            {
                name: { type: "string", required: true },
                access: { type: "string", required: false, format: "access" },
            },

            {
                access: (v?: unknown) =>
                    ["MANAGER", "ADMIN", "USER"].includes(v as string),
            }
        ) as { name: string; department_id: number; access: AccessKey };
        name = data.name as string;
        access = data.access as AccessKey;
    } catch (_e) {
        const { message } = _e as Error;
        res.status(400).send(message);
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!(await User.isAdmin(dbConnection, current_business_id!, user_id!))) {
        res.sendStatus(403);
        return;
    }

    const role = await dbConnection
        .createQueryBuilder()
        .select("r")
        .from(Role, "r")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("r.id = :id", { id })
        .andWhere("d.business_id = :current_business_id", {
            current_business_id,
        })
        .getOne();

    if (!role) {
        res.sendStatus(400);
        return;
    } else if (role.prevent_edit) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.update(
        Role,
        { id },
        {
            name,
            updated_by_user_id: user_id,
            access,
        }
    );

    res.sendStatus(200);
};

export default putController;
