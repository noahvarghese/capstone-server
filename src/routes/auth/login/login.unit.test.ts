import { getMockRes } from "@jest-mock/express";
import Business from "@models/business";
import Membership from "@models/membership";
import User from "@models/user/user";
import DBConnection from "@test/support/db_connection";
import DataServiceError from "@util/errors/service";
import { Request } from "express";
import { loginController } from "./controller";
import { loginHandler } from "./handler";

const data = {
    email: "test@test.com",
    password: "TEST",
    first_name: "TEST",
    last_name: "TEST",
};

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

test("invalid email", async () => {
    await loginController(
        {
            body: { email: "TEST", password: data.password },
        } as unknown as Request,
        res
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Invalid email OR empty password");
});

test("empty password", async () => {
    await loginController(
        {
            body: { email: "TEST", password: data.password },
        } as unknown as Request,
        res
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Invalid email OR empty password");
});

describe("user exists", () => {
    let user_id!: number;

    beforeAll(async () => {
        await DBConnection.init();
        const {
            identifiers: [{ id }],
        } = await (
            await DBConnection.get()
        ).manager.insert(
            User,
            await new User(data).hashPassword(data.password)
        );
        user_id = id;
    });

    afterAll(async () => {
        await (await DBConnection.get()).manager.delete(User, () => "");
        await DBConnection.close();
    });

    test("invalid password", async () => {
        let errorThrown = false;

        try {
            await loginHandler(
                await DBConnection.get(),
                data.email,
                "Wrong password"
            );
        } catch (_e) {
            errorThrown = true;
            const code = (_e as DataServiceError).code;
            expect(code).toBe(401);
        }

        expect(errorThrown).toBe(true);
    });

    describe("valid login", () => {
        test("not a member of a business", async () => {
            let errorThrown = false;

            try {
                await loginHandler(
                    await DBConnection.get(),
                    data.email,
                    data.password
                );
            } catch (_e) {
                errorThrown = true;
                const code = (_e as DataServiceError).code;
                expect(code).toBe(403);
            }

            expect(errorThrown).toBe(true);
        });

        describe("user is a member of a business", () => {
            beforeAll(async () => {
                const conn = await DBConnection.get();

                const {
                    identifiers: [{ id: business_id }],
                } = await conn.manager.insert(
                    Business,
                    new Business({
                        name: "TEST",
                        address: "TEST",
                        city: "TEST",
                        postal_code: "L6A3G2",
                        province: "TE",
                    })
                );
                await conn.manager.insert(
                    Membership,
                    new Membership({
                        user_id,
                        business_id,
                        updated_by_user_id: user_id,
                    })
                );
            });

            afterAll(async () => {
                const conn = await DBConnection.get();
                await conn.manager.delete(Membership, () => "");
                await conn.manager.delete(Business, () => "");
            });

            test("default business not set", async () => {
                let errorThrown = false;

                try {
                    await loginHandler(
                        await DBConnection.get(),
                        data.email,
                        data.password
                    );
                } catch (_e) {
                    errorThrown = true;
                    const code = (_e as DataServiceError).code;
                    expect(code).toBe(500);
                }

                expect(errorThrown).toBe(true);
            });

            describe("Default business set", () => {
                beforeAll(async () => {
                    const conn = await DBConnection.get();

                    await conn.manager.update(Membership, () => "", {
                        default_option: true,
                    });
                });

                test("success", async () => {
                    await loginController(
                        {
                            body: data,
                            session: {},
                            dbConnection: await DBConnection.get(),
                        } as unknown as Request,
                        res
                    );
                    expect(res.status).toHaveBeenCalledWith(200);
                });
            });
        });
    });
});
