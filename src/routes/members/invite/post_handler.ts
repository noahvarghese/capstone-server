import MembershipRequest from "@models/membership_request";
import User, { UserAttributes } from "@models/user/user";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import Logs from "@util/logs/logs";
import { Connection } from "typeorm";

/**
 *
 * @param connection
 * @param options
 * @param adminUserId
 * @param businessId
 * @returns the id of the user
 */
export const postHandler = async (
    connection: Connection,
    options: Pick<UserAttributes, "email"> &
        Partial<Pick<UserAttributes, "phone">>,
    updated_by_user_id: number,
    business_id: number
): Promise<number> => {
    let user_id = (
        await connection.manager.findOne(User, {
            where: { email: options.email },
        })
    )?.id;

    if (!user_id) {
        ({
            identifiers: [{ user_id }],
        } = await connection.manager.insert(User, new User(options)));
    }

    if (!user_id) {
        throw new DataServiceError(ServiceErrorReasons.DATABASE);
    }

    const membershipRequest = new MembershipRequest({
        user_id,
        business_id,
        updated_by_user_id,
    });

    try {
        await connection.manager.save(MembershipRequest, membershipRequest);
        return user_id;
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new DataServiceError(ServiceErrorReasons.DATABASE);
    }
};
