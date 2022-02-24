import { getMockRes } from "@jest-mock/express";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import putController from "./put";
import { Request } from "express";
import { Connection } from "typeorm";
import Membership from "@models/membership";
import { uid } from "rand-token";
import User from "@models/user/user";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

let business_id: number, conn: Connection;

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();
    ({ business_id } = await setupAdmin(conn));
});

afterAll(async () => {
    const conn = await DBConnection.get();
    await unitTeardown(conn);
    await DBConnection.close();
});

test("invalid token", async () => {
    await putController(
        {
            params: { token: "YOLO" },
            body: {},
            dbConnection: conn,
        } as unknown as Request,
        res
    );
    expect(res.sendStatus).toHaveBeenCalledWith(400);
});

describe("token created", () => {
    let token: string | null;
    let user_id: number;
    beforeAll(async () => {
        ({ id: user_id } = await conn.manager.save(
            User,
            new User({
                email: "TEST",
            })
        ));

        await conn.manager.insert(
            Membership,
            new Membership({
                user_id,
                business_id,
                updated_by_user_id: user_id,
                token: uid(32),
            })
        );

        ({ token } = await conn.manager.findOneOrFail(Membership, {
            where: { user_id, business_id },
        }));
    });

    describe("expired token", () => {
        beforeAll(async () => {
            await conn.manager.update(
                Membership,
                { user_id, business_id },
                { token_expiry: null }
            );
        });
        test("fails", async () => {
            await putController(
                {
                    params: { token },
                    body: {},
                    dbConnection: conn,
                } as unknown as Request,
                res
            );
            expect(res.sendStatus).toHaveBeenCalledWith(400);
        });
    });
    describe("valid token, empty user", () => {
        beforeEach(async () => {
            token = uid(32);

            const token_expiry = new Date();
            token_expiry.setDate(token_expiry.getDate() + 1);

            await conn.manager.update(
                Membership,
                { user_id, business_id },
                // reseting the token resets the date as well
                { token, token_expiry, accepted: false }
            );

            await conn.manager.update(User, user_id, {
                first_name: "",
                last_name: "",
                password: "",
            });
        });

        test("no data", async () => {
            await putController(
                {
                    params: { token },
                    body: {},
                    dbConnection: conn,
                } as unknown as Request,
                res
            );
            expect(res.sendStatus).toHaveBeenCalledWith(405);
        });

        describe("new user, missing data", () => {
            const cases = [
                {
                    first_name: "",
                    last_name: "",
                    password: "",
                    confirm_password: "",
                },
                {
                    first_name: " ",
                    last_name: " ",
                    password: " ",
                    confirm_password: " ",
                },
            ];

            test.each(cases)("%p", async (body) => {
                await putController(
                    {
                        params: { token },
                        body,
                        dbConnection: conn,
                    } as unknown as Request,
                    res
                );

                expect(res.sendStatus).toHaveBeenCalledWith(405);
            });
        });

        describe("new user, invalid data", () => {
            const cases = [
                {
                    first_name: "asdf",
                    last_name: "",
                    password: "",
                    confirm_password: "",
                },
                {
                    first_name: undefined,
                    last_name: "asdf",
                    password: "123",
                    confirm_password: "123",
                },
                {
                    first_name: null,
                    last_name: "",
                    password: "123",
                    confirm_password: "123",
                },
                {
                    first_name: 123,
                    last_name: "",
                    password: "123",
                    confirm_password: "123",
                },
                {
                    first_name: NaN,
                    last_name: "",
                    password: "123",
                    confirm_password: "123",
                },
            ];

            test.each(cases)("%p", async (body) => {
                await putController(
                    {
                        params: { token },
                        body,
                        dbConnection: conn,
                    } as unknown as Request,
                    res
                );

                expect(res.sendStatus).toHaveBeenCalledWith(400);
            });
        });

        test("invalid password", async () => {
            await putController(
                {
                    params: { token },
                    body: {
                        first_name: "test",
                        last_name: "test",
                        password: "123",
                        confirm_password: "3456",
                    },
                    dbConnection: conn,
                } as unknown as Request,
                res
            );

            expect(res.sendStatus).toHaveBeenCalledWith(400);
        });

        test("valid token, new user", async () => {
            await putController(
                {
                    params: { token },
                    body: {
                        first_name: "test",
                        last_name: "test",
                        password: "123",
                        confirm_password: "123",
                    },
                    dbConnection: conn,
                } as unknown as Request,
                res
            );

            expect(res.sendStatus).toHaveBeenCalledWith(200);
            const m = await conn.manager.findOneOrFail(Membership, {
                where: { user_id, business_id },
            });
            expect(m.token).toBe(null);
            expect(m.token_expiry).toBe(null);
            expect(m.accepted).toBe(true);
        });
    });

    describe("existing user", () => {
        beforeAll(async () => {
            token = uid(32);
            const token_expiry = new Date();
            token_expiry.setDate(token_expiry.getDate() + 1);
            await Promise.all([
                conn.manager.update(
                    Membership,
                    { user_id, business_id },
                    { accepted: false, token, token_expiry }
                ),
                conn.manager.update(User, user_id, {
                    first_name: "TEST",
                    last_name: "TEST",
                    password: "TEST",
                }),
            ]);
        });

        test("Success", async () => {
            await putController(
                {
                    params: { token },
                    body: {},
                    dbConnection: conn,
                } as unknown as Request,
                res
            );

            expect(res.sendStatus).toHaveBeenCalledWith(200);
            const m = await conn.manager.findOneOrFail(Membership, {
                where: { user_id, business_id },
            });
            expect(m.token).toBe(null);
            expect(m.token_expiry).toBe(null);
            expect(m.accepted).toBe(true);
        });
    });
});
