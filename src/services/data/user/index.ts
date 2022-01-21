import User from "@models/user/user";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import Logs from "@util/logs/logs";
import { EntityManager, getConnection } from "typeorm";
import { RegisterBusinessProps } from "@controllers/auth";

export * as password from "./password";
export * as member from "./members";

export const exists = async (
    email: string,
    entityManager?: EntityManager
): Promise<boolean> => {
    const manager = entityManager ?? getConnection().manager;

    try {
        const count = await manager.count(User, {
            where: { email },
        });

        return count > 0;
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            "Unable to find user",
            ServiceErrorReasons.DATABASE_ERROR
        );
    }
};

/**
 * Checks the user is who they say they are
 * @param email
 * @param password
 * @returns {number | undefined} user id if successful
 */
export const find = async (
    email: string,
    password: string
): Promise<number> => {
    const connection = getConnection();
    const user = await connection.manager.findOne(User, { where: { email } });

    if (!user) {
        throw new DataServiceError(
            `Invalid login ${email}`,
            ServiceErrorReasons.NOT_AUTHENTICATED
        );
    }

    if (!user.password) {
        throw new DataServiceError(
            "User not finished registration",
            ServiceErrorReasons.NOT_AUTHENTICATED
        );
    }

    try {
        const valid = await user.comparePassword(password);

        if (!valid) {
            throw new DataServiceError(
                "Invalid login",
                ServiceErrorReasons.NOT_AUTHENTICATED
            );
        }

        return user.id;
    } catch (e) {
        if (e instanceof DataServiceError) throw e;

        const { message } = e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            "Unable to compare passwords",
            ServiceErrorReasons.UTILITY_ERROR
        );
    }
};

/**
 *
 * @param props
 * @param entityManager optional - Allows usage in transaction
 */
export const create = async (
    props: Pick<
        RegisterBusinessProps,
        "first_name" | "last_name" | "email" | "phone" | "password"
    >,
    entityManager?: EntityManager
): Promise<number> => {
    const { first_name, last_name, email, phone, password } = props;

    const user = new User({
        first_name,
        last_name,
        email,
        phone,
    });

    // Doesn't replace validation
    // just checks whether it should be set
    // As we can use this function when creating the user invites
    if (password && password.length > 0) {
        try {
            await user.hashPassword(password);
        } catch (e) {
            const { message } = e as Error;
            Logs.Error(message);
            throw new DataServiceError(
                "Unable to set password",
                ServiceErrorReasons.UTILITY_ERROR
            );
        }
    }

    // Allows transactional capabalities
    try {
        const result = await (entityManager ?? getConnection().manager).insert(
            User,
            user
        );
        return result.identifiers[0].id;
    } catch (e) {
        const { message } = e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            "Unable to create user",
            ServiceErrorReasons.DATABASE_ERROR
        );
    }
};

export const update = async (
    id: number,
    details: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        birthday: string | undefined;
    }
): Promise<void> => {
    try {
        await getConnection().manager.update(User, id, details);
    } catch (e) {
        const { message } = e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            "Unable to update user",
            ServiceErrorReasons.DATABASE_ERROR
        );
    }
};
