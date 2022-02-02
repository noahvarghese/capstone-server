import Membership from "@models/membership";
import User from "@models/user/user";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import { Connection } from "typeorm";

export const loginHandler = async (
    connection: Connection,
    email: string,
    password: string
): Promise<{
    user_id: number;
    business_ids: number[];
    current_business_id: number;
}> => {
    const user = await connection.manager.findOne(User, { where: { email } });

    // Not logged in
    if (!user || !user.password || !(await user.comparePassword(password)))
        throw new DataServiceError(ServiceErrorReasons.NOT_AUTHENTICATED);

    const m = await connection.manager.find(Membership, {
        where: { user_id: user.id },
    });

    if (m.length === 0)
        throw new DataServiceError(
            ServiceErrorReasons.PERMISSIONS,
            "Please contact your manager"
        );

    const defaultBusinessId =
        m.find((x) => x.default_option)?.business_id ?? NaN;

    if (isNaN(defaultBusinessId))
        throw new DataServiceError(
            ServiceErrorReasons.UTILITY,
            "No default business set"
        );

    return {
        user_id: user.id,
        business_ids: m.map((x) => x.business_id),
        current_business_id: defaultBusinessId,
    };
};
