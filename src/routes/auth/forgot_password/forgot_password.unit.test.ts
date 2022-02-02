import { getMockRes } from "@jest-mock/express";
import User from "@models/user/user";
import DBConnection from "@test/support/db_connection";
import { Request } from "express";
import { forgotPasswordController } from "./controller";
import { forgotPasswordHandler } from "./handler";

const data = {
    email: process.env.MAIL_USER ?? "",
    first_name: "TEST",
    last_name: "TEST",
    password: "TEST",
};

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

test("Invalid email", async () => {
    await forgotPasswordController(
        {
            body: { email: "bad email" },
        } as unknown as Request,
        res
    );

    expect(res.status).toBeCalledWith(400);
});

describe("database connection required", () => {
    beforeAll(DBConnection.init);
    afterAll(DBConnection.close);

    test("User doesn't exist", async () => {
        await forgotPasswordController(
            {
                body: { email: data.email },
                dbConnection: await DBConnection.get(),
            } as unknown as Request,
            res
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
            "No account for user " + data.email
        );
    });

    describe("Requires setup", () => {
        beforeAll(async () => {
            await (
                await DBConnection.get()
            ).manager.insert(User, new User(data));
        });

        afterAll(async () => {
            await (await DBConnection.get()).manager.delete(User, () => "");
        });

        test("creates token and sends instructions", async () => {
            let errorThrown = false;
            const conn = await DBConnection.get();
            try {
                await forgotPasswordHandler(conn, data.email);
            } catch (_) {
                errorThrown = true;
            }

            const user = await conn.manager.findOneOrFail(User, {
                where: { email: data.email },
            });

            expect(user.token).toBeTruthy();
            expect(user.token_expiry?.getTime()).toBeGreaterThan(
                new Date().getTime()
            );
            expect(errorThrown).toBe(false);
        });
    });
});
