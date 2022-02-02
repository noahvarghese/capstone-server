import User from "@models/user/user";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import Logs from "@util/logs/logs";
import { uid } from "rand-token";
import { Connection } from "typeorm";

export const forgotPasswordHandler = async (
    connection: Connection,
    email: string
): Promise<void> => {
    try {
        // gen token
        await connection.manager.update(
            User,
            { email: email },
            { token: uid(32) }
        );
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            ServiceErrorReasons.DATABASE,
            "Unable to create token"
        );
    }
};
