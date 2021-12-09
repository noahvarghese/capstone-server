import User from "@models/user/user";
import Event from "@models/event";
import { userAttributes } from "@test/model/attributes";
import DBConnection from "@test/support/db_connection";
import { enablePasswordReset, findByLogin, resetPassword } from ".";
import { Connection } from "typeorm";

beforeAll(async () => await DBConnection.init());
afterAll(async () => {
    await DBConnection.close();
});

describe("Forgot password route", () => {
    let user: User;
    let connection: Connection;

    beforeAll(async () => {
        connection = await DBConnection.get();
        user = await connection.manager.save(new User(userAttributes()));

        await enablePasswordReset(connection, user);

        user = await connection.manager.findOneOrFail(User, {
            where: { id: user.id },
        });
    });

    afterAll(async () => await DBConnection.reset());

    test("enables user reset", async () => {
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

    describe("Create user to share", () => {
        let connection: Connection;
        let user: User;

        beforeAll(async () => {
            connection = await DBConnection.get();

            user = await connection.manager.save(new User(userAttributes()));

            await enablePasswordReset(connection, user);

            user = await connection.manager.findOneOrFail(User, {
                where: { id: user.id },
            });

            if (!user.token) throw new Error("Token missing");
        });

        afterAll(async () => await DBConnection.reset());

        test("Password too short", async () => {
            let errorMessage = "";

            try {
                await resetPassword(connection, user.token as string, "test");
            } catch (e) {
                const { message } = e as Error;
                errorMessage = message;
            }

            expect(errorMessage).toMatch(/^password not long enough$/i);
        });

        test("Valid password and token ", async () => {
            const NEW_PASSWORD = "TEST1234";
            await resetPassword(connection, user.token as string, NEW_PASSWORD);

            expect(
                await findByLogin(connection, user.email, NEW_PASSWORD)
            ).toBeGreaterThan(0);
        });
    });
});
