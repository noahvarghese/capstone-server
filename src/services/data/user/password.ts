import User from "@models/user/user";
import { requestResetPasswordEmail, resetPasswordEmail } from "@services/email";
import ServiceError, { ServiceErrorReasons } from "@util/errors/service_error";
import { Connection, MoreThan } from "typeorm";

/**
 * Creates token and expiry
 * And then sends email to notify user they can change their password
 * @param connection
 * @param user
 */
export const enablePasswordReset = async (
    connection: Connection,
    user: User
): Promise<void> => {
    user.createToken();

    await connection.manager.update(
        User,
        { email: user.email },
        { token: user.token, token_expiry: user.token_expiry }
    );

    await requestResetPasswordEmail(user);
};

/**
 * resets the user's password
 * @param connection
 * @param token
 * @param password
 * @param confirmPassword
 * @returns {number} user id
 */
export const resetPassword = async (
    connection: Connection,
    token: string,
    password: string
): Promise<number> => {
    const user = await connection.manager.findOneOrFail(User, {
        where: {
            token,
            token_expiry: MoreThan(new Date()),
        },
    });

    if (!user)
        throw new ServiceError("Invalid token", ServiceErrorReasons.AUTH);

    if (!(await user.resetPassword(password, token))) {
        throw new ServiceError(
            "Password not long enough",
            ServiceErrorReasons.PARAMS
        );
    }

    await connection.manager.update(
        User,
        { id: user.id },
        {
            token: user.token,
            token_expiry: user.token_expiry,
            password: user.password,
        }
    );

    await resetPasswordEmail(user);
    return user.id;
};
