import { Request } from "express";
import { getMockRes } from "@jest-mock/express";
import { uid } from "rand-token";
import { resetPasswordController } from "./controller";
import DBConnection from "@test/support/db_connection";
import Event from "@models/event";
import User from "@models/user/user";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

test("no token", async () => {
    await resetPasswordController(
        { params: { token: "" }, body: {} } as unknown as Request,
        res
    );

    expect(res.sendStatus).toHaveBeenCalledWith(401);
});

test("missing password", async () => {
    await resetPasswordController(
        { params: { token: "token" }, body: {} } as unknown as Request,
        res
    );

    expect(res.sendStatus).toHaveBeenCalledWith(400);
    return;
});

test("missing confirm password", async () => {
    await resetPasswordController(
        {
            params: { token: "token" },
            body: { password: "password", confirm_password: undefined },
        } as unknown as Request,
        res
    );

    expect(res.sendStatus).toHaveBeenCalledWith(400);
    return;
});

test("mismatch passwords", async () => {
    await resetPasswordController(
        {
            params: { token: "token" },
            body: {
                password: "password",
                confirm_password: "confirm password",
            },
        } as unknown as Request,
        res
    );

    expect(res.sendStatus).toHaveBeenCalledWith(400);
    return;
});

describe("database", () => {
    beforeAll(DBConnection.init);
    afterAll(DBConnection.close);

    test("invalid token", async () => {
        await resetPasswordController(
            {
                params: { token: "token" },
                dbConnection: await DBConnection.get(),
                body: {
                    password: "password",
                    confirm_password: "password",
                },
            } as unknown as Request,
            res
        );

        expect(res.sendStatus).toHaveBeenCalledWith(401);
    });

    describe("create user", () => {
        let user_id!: number;

        beforeAll(async () => {
            const conn = await DBConnection.get();
            // get user id of created user
            ({
                identifiers: [{ id: user_id }],
            } = await conn.manager.insert(
                User,
                await new User({
                    first_name: "TEST",
                    last_name: "TEST",
                    email: process.env.TEST_EMAIL_1 ?? "",
                }).hashPassword("password")
            ));

            await conn.manager.update(User, user_id, { token: uid(32) });
        });

        afterAll(async () => {
            const conn = await DBConnection.get();
            await conn.manager.clear(Event);
            await conn.manager.delete(User, () => "");
        });

        test("controller success", async () => {
            const conn = await DBConnection.get();
            const { token } = await conn.manager.findOneOrFail(User, user_id);

            await resetPasswordController(
                {
                    params: { token },
                    dbConnection: conn,
                    body: {
                        password: "new password",
                        confirm_password: "new password",
                    },
                } as unknown as Request,
                res
            );

            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });
    });
});
