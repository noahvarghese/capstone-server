import Membership from "@models/membership";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

export const setDefaultBusinessController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        dbConnection: connection,
        session: {
            user_id: u_id,
            current_business_id: curr_b_id,
            business_ids: b_ids,
        },
        params: { id },
    } = req;

    // Did the checks in the middleware
    const user_id = Number(u_id);
    const current_business_id = Number(curr_b_id);
    const business_id = Number(id);
    const business_ids = b_ids as Array<number>;

    const isMember =
        current_business_id === business_id ||
        business_ids.includes(business_id);

    if (!isMember) {
        res.sendStatus(403);
        return;
    }

    try {
        // get current default business for user
        const defaultMembership = await connection.manager.findOneOrFail(
            Membership,
            {
                where: { default_option: true, user_id, accepted: true },
            }
        );

        await connection.transaction(async (tm) => {
            await Promise.all([
                tm.update(
                    Membership,
                    { user_id, business_id },
                    { default_option: true }
                ),
                tm.update(
                    Membership,
                    { user_id, business_id: defaultMembership.business_id },
                    { default_option: false }
                ),
            ]);
        });

        res.sendStatus(200);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
    }
};
