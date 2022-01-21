import User from "@models/user/user";
import { forgotPasswordEmail, resetPasswordEmail } from "@services/email";
import ServiceError, { ServiceErrorReasons } from "@util/errors/service";
import { getConnection, MoreThan } from "typeorm";

/**
 * Creates token and expiry
 * And then sends email to notify user they can change their password
 * @param connection
 * @param user
 */
export const enableReset = async (user: User): Promise<void> => {
    const connection = getConnection();

    user.createToken();

    await connection.manager.update(
        User,
        { email: user.email },
        { token: user.token, token_expiry: user.token_expiry }
    );

    await forgotPasswordEmail(connection, user);
};

/**
 * resets the user's password
 * @param token
 * @param password
 * @param confirmPassword
 * @returns {number} user id
 */
export const reset = async (
    token: string,
    password: string
): Promise<number> => {
    const connection = getConnection();

    const user = await connection.manager.findOne(User, {
        where: {
            token,
            token_expiry: MoreThan(new Date()),
        },
    });

    if (!user)
        throw new ServiceError(
            "Invalid token",
            ServiceErrorReasons.NOT_AUTHENTICATED
        );

    if (!(await user.resetPassword(password, token))) {
        throw new ServiceError(
            "Password not long enough",
            ServiceErrorReasons.PARAMETERS_MISSING
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

    await resetPasswordEmail(connection, user);
    return user.id;
};
