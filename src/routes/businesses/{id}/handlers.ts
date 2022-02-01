import Membership from "@models/membership";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import Logs from "@util/logs/logs";
import { Connection } from "typeorm";

export const isMemberHandler = async (
    connection: Connection,
    user_id: number,
    business_id: number
): Promise<boolean> => {
    let count: number;

    try {
        count = await connection
            .createQueryBuilder()
            .select("created_on")
            .from(Membership, "m")
            .where("m.user_id =:user_id", { user_id })
            .andWhere("m.business_id = :business_id", { business_id })
            .getCount();
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            "Failed to retrieve memberships",
            ServiceErrorReasons.DATABASE
        );
    }

    if (count > 1)
        throw new DataServiceError(
            "Multiple memberships returned",
            ServiceErrorReasons.DATABASE
        );

    return count === 1;
};

/**
 * Assumes the user is a member of the business already
 * Requires that user have a default business set
 * @param connection
 * @param user_id
 * @param business_id
 */
export const changeDefaultBusinessHandler = async (
    connection: Connection,
    user_id: number,
    business_id: number
): Promise<void> => {
    try {
        await connection.transaction(async (tm) => {
            // get current default business for user
            const defaultMembership = await tm.findOne(Membership, {
                where: { default_option: true, user_id },
            });

            if (!defaultMembership)
                throw new Error(
                    `Could not find default membership for user ${user_id}`
                );

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
            "Unable to set default membership",
            ServiceErrorReasons.DATABASE
        );
    }
};
