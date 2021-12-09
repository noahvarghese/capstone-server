import User from "@models/user/user";
import Event from "@models/event";
import { userAttributes } from "@test/model/attributes";
import DBConnection from "@test/support/db_connection";
import { enablePasswordReset, findByLogin, resetPassword } from ".";

beforeEach(DBConnection.init);
afterEach(async () => {
    await DBConnection.close(true);
});

describe("Forgot password route", () => {
    test("enables user reset", async () => {
        const connection = await DBConnection.get();

        let user = await connection.manager.save(
            new User({ ...userAttributes() })
        );

        await enablePasswordReset(connection, user);

        user = await connection.manager.findOneOrFail(User, {
            where: { id: user.id },
        });

        expect(user.token).not.toBe(null);

        // And the expiry date is correct
        // We should test the specific time it sets
        expect(user.token_expiry).not.toBe(null);
        expect(
            user.token_expiry instanceof Date
                ? user.token_expiry.getTime()
                : -Infinity
        ).toBeGreaterThan(new Date().getTime());
    });

    test("sends an email", async () => {
        const connection = await DBConnection.get();

        let user = await connection.manager.save(
            new User({ ...userAttributes() })
        );

        await enablePasswordReset(connection, user);

        user = await connection.manager.findOneOrFail(User, {
            where: { id: user.id },
        });

        const event = (
            await connection.manager.find(Event, {
                where: { user_id: user.id, name: "Request Reset Password" },
                order: { created_on: "DESC" },
            })
        )[0];

        expect(event).toBeTruthy();

        expect(event.created_on).not.toBe(null);

        expect(event.created_on?.getUTCMilliseconds()).toBeLessThanOrEqual(
            new Date().getUTCMilliseconds() - 10
        );
    });
});

describe("Reset Password", () => {
    test("Invalid token", async () => {
        const connection = await DBConnection.get();

        try {
            await resetPassword(connection, "1233456", "testtest");
        } catch (e) {
            const { message } = e as Error;
            expect(message).toMatch(/^invalid token$/i);
        }
    });

    test("Password too short", async () => {
        const connection = await DBConnection.get();

        let user = await connection.manager.save(
            new User({ ...userAttributes() })
        );

        await enablePasswordReset(connection, user);

        user = await connection.manager.findOneOrFail(User, {
            where: { id: user.id },
        });

        if (!user.token) throw new Error("Token missing");

        let errorMessage = "";

        try {
            await resetPassword(connection, user.token, "test");
        } catch (e) {
            const { message } = e as Error;
            errorMessage = message;
        }

        expect(errorMessage).toMatch(/^password not long enough$/i);
    });

    test("Valid password and token ", async () => {
        const NEW_PASSWORD = "TEST1234";
        const connection = await DBConnection.get();

        let user = await connection.manager.save(
            new User({ ...userAttributes() })
        );

        await enablePasswordReset(connection, user);

        user = await connection.manager.findOneOrFail(User, {
            where: { id: user.id },
        });

        if (!user.token) throw new Error("Token missing");

        await resetPassword(connection, user.token, NEW_PASSWORD);

        expect(
            await findByLogin(connection, user.email, NEW_PASSWORD)
        ).toBeGreaterThan(0);
    });
});
