import Membership from "@models/membership";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import Logs from "@util/logs/logs";
import { Connection } from "typeorm";

/**
 * Assumes the user is a member of the business already
 * Requires that user have a default business set
 * @param connection
 * @param user_id
 * @param business_id
 */
export const setDefaultBusinessHandler = async (
    connection: Connection,
    user_id: number,
    business_id: number
): Promise<void> => {
    try {
        // get current default business for user
        const defaultMembership = await connection.manager.findOne(Membership, {
            where: { default_option: true, user_id },
        });

        if (!defaultMembership)
            throw new Error(
                `Could not find default membership for user ${user_id}`
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
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            ServiceErrorReasons.DATABASE,
            "Unable to set default membership"
        );
    }
};
