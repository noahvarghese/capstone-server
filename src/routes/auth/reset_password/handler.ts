import User from "@models/user/user";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import Logs from "@util/logs/logs";
import { Connection } from "typeorm";

export const resetPasswordHandler = async (
    connection: Connection,
    token: string,
    password: string
): Promise<void> => {
    const user = await connection.manager.findOne(User, { where: { token } });

    if (!user)
        throw new DataServiceError(ServiceErrorReasons.NOT_AUTHENTICATED);

    if (!user.compareToken(token))
        throw new DataServiceError(ServiceErrorReasons.NOT_AUTHENTICATED);

    try {
        await user.resetPassword(password);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            ServiceErrorReasons.UTILITY,
            "Failed to reset password"
        );
    }

    try {
        await connection.manager.update(User, user.id, {
            password: user.password,
        });
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new DataServiceError(ServiceErrorReasons.DATABASE);
    }
};
