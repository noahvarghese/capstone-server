// import User from "@models/user/user";
// import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

const sortFields = ["name", "num_members", "num_managers"] as const;
export type SortFieldKey = typeof sortFields[number];

const sortOrders = ["ASC", "DESC"] as const;
export type SortOrderKey = typeof sortOrders[number];

const getController = async (req: Request, res: Response): Promise<void> => {
    Logs.Debug(req);
    // const {
    //     query: { search, sort_order, sort_field, limit, page },
    //     session: { user_id, current_business_id },
    //     dbConnection,
    // } = req;

    // if ((sort_order && !sort_field) || (!sort_order && sort_field)) {
    //     res.status(400).send("Invalid sort options");
    //     return;
    // }

    // if (sort_order && !sortOrders.includes(sort_order as SortOrderKey)) {
    //     res.status(400).send("Invalid sort options");
    //     return;
    // }

    // if (sort_field && !sortFields.includes(sort_field as SortFieldKey)) {
    //     res.status(400).send("Invalid sort options");
    //     return;
    // }

    // if ((limit && !page) || (!limit && page)) {
    //     res.status(400).send("Invalid pagination options");
    //     return;
    // }

    // if (limit && !isNumber(limit)) {
    //     res.status(400).send("Invalid pagination options");
    //     return;
    // }

    // if (page && !isNumber(page)) {
    //     res.status(400).send("Invalid pagination options");
    //     return;
    // }

    // try {
    //     const [isAdmin, isManager] = await Promise.all([
    //         await User.isAdmin(
    //             dbConnection,
    //             current_business_id ?? NaN,
    //             user_id ?? NaN
    //         ),
    //         await User.isManager(
    //             dbConnection,
    //             current_business_id ?? NaN,
    //             user_id ?? NaN
    //         ),
    //     ]);

    //     if (!(isAdmin || isManager)) {
    //         res.sendStatus(403);
    //         return;
    //     }
    // } catch (_e) {
    //     const { message } = _e as Error;
    //     Logs.Error(message);
    //     res.sendStatus(500);
    //     return;
    // }

    // let query = dbConnection
    //     .createQueryBuilder()
    //     .select()
    //     .from(Department, "d")
    //     .leftJoin(Role, "r", "r.department_id = d.id")
    //     .leftJoin(UserRole, "ur", "ur.role_id = r.id");

    // execute actual query
    // get departments
    // get managers for department
    // sum managers
    // get number of all members

    res.status(200).send([]);
    return;
};

export default getController;
