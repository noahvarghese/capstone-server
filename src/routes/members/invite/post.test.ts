import { getMockRes } from "@jest-mock/express";
import Business from "@models/business";
import Department from "@models/department";
import Event from "@models/event";
import Membership from "@models/membership";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import DBConnection from "@test/support/db_connection";
import sleep from "@util/sleep";
import { Request } from "express";
import { Connection } from "typeorm";
import { sendInviteController } from "./post";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

test("Invalid email", async () => {
    await sendInviteController(
        {
            session: { user_id: 1, current_business_id: 1 },
            body: { email: "test" },
        } as unknown as Request,
        res
    );
    expect(res.status).toHaveBeenCalledWith(400);
});

test("Invalid phone", async () => {
    await sendInviteController(
        {
            session: { user_id: 1, current_business_id: 1 },
            body: { email: "test@test.com", phone: "asdf" },
        } as unknown as Request,
        res
    );
    expect(res.status).toHaveBeenCalledWith(400);
});

describe("database usage", () => {
    let user_id!: number, business_id!: number, conn!: Connection;

    beforeAll(async () => {
        await DBConnection.init();
        conn = await DBConnection.get();

        [
            {
                identifiers: [{ id: user_id }],
            },
            {
                identifiers: [{ id: business_id }],
            },
        ] = await Promise.all([
            conn.manager.insert(
                User,
                new User({ email: process.env.TEST_EMAIL_1 ?? "" })
            ),
            conn.manager.insert(
                Business,
                new Business({
                    address: "TEST",
                    city: "TEST",
                    postal_code: "L6T1B3",
                    province: "ON",
                    name: "TEST",
                })
            ),
        ]);

        const [
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _,
            {
                identifiers: [{ id: department_id }],
            },
        ] = await Promise.all([
            conn.manager.insert(
                Membership,
                new Membership({
                    user_id,
                    updated_by_user_id: user_id,
                    business_id,
                })
            ),
            conn.manager.insert(
                Department,
                new Department({
                    name: "TEST",
                    business_id,
                    updated_by_user_id: user_id,
                })
            ),
        ]);

        const {
            identifiers: [{ id: role_id }],
        } = await conn.manager.insert(
            Role,
            new Role({
                department_id,
                updated_by_user_id: user_id,
                access: "ADMIN",
            })
        );

        await conn.manager.insert(
            UserRole,
            new UserRole({ role_id, user_id, updated_by_user_id: user_id })
        );
    });

    afterAll(async () => {
        await Promise.all([
            conn.manager.clear(Event),
            conn.manager.delete(UserRole, () => ""),
            conn.manager.delete(Membership, () => ""),
        ]);
        await conn.manager.delete(Role, () => "");
        await Promise.all([
            conn.manager.delete(Department, () => ""),
            conn.manager.delete(Membership, () => ""),
        ]);
        await Promise.all([
            conn.manager.delete(User, () => ""),
            conn.manager.delete(Business, () => ""),
        ]);

        await DBConnection.close();
    });

    describe("user isnt admin", () => {
        const cases = ["USER", "MANAGER"];

        afterAll(async () => {
            await conn.manager.update(Role, () => "", { access: "ADMIN" });
        });
        test.each(cases)("%p", async () => {
            await conn.manager.update(Role, () => "", {
                access: "USER",
            });
            await sendInviteController(
                {
                    session: {
                        user_id,
                        current_business_id: business_id,
                        business_ids: [business_id],
                    },
                    body: { email: process.env.TEST_EMAIL_1 ?? "" },
                    dbConnection: conn,
                } as unknown as Request,
                res
            );
            expect(res.sendStatus).toHaveBeenCalledWith(403);
        });
    });

    describe("success", () => {
        test("Email is sent on success", async () => {
            await sendInviteController(
                {
                    session: {
                        user_id,
                        current_business_id: business_id,
                        business_ids: [business_id],
                    },
                    body: { email: process.env.TEST_EMAIL_2 ?? "" },
                    dbConnection: conn,
                } as unknown as Request,
                res
            );

            expect(res.status).not.toHaveBeenCalled();
            expect(res.sendStatus).toHaveBeenCalledWith(201);
        });

        test("Invited user is new to system", async () => {
            // delete user
            let user = await conn.manager.findOneOrFail(User, {
                where: { email: process.env.TEST_EMAIL_2 ?? "" },
            });

            await conn.manager.clear(Event);
            await conn.manager.delete(Membership, {
                user_id: user.id,
            });
            await conn.manager.delete(User, {
                id: user.id,
            });

            await sendInviteController(
                {
                    session: {
                        user_id,
                        current_business_id: business_id,
                        business_ids: [business_id],
                    },
                    body: { email: process.env.TEST_EMAIL_2 ?? "" },
                    dbConnection: conn,
                } as unknown as Request,
                res
            );

            expect(res.sendStatus).toHaveBeenCalledWith(201);

            user = await conn.manager.findOneOrFail(User, {
                where: { email: process.env.TEST_EMAIL_2 ?? "" },
            });

            const m = await conn.manager.findOne(Membership, {
                user_id: user.id,
            });

            expect(m).not.toBe(undefined);
        });

        test("Invited user exists in system", async () => {
            // delete membership request
            const user = await conn.manager.findOneOrFail(User, {
                where: { email: process.env.TEST_EMAIL_2 ?? "" },
            });

            await conn.manager.clear(Event);
            await conn.manager.delete(Membership, {
                user_id: user.id,
            });

            await sendInviteController(
                {
                    session: {
                        user_id,
                        current_business_id: business_id,
                        business_ids: [business_id],
                    },
                    body: { email: process.env.TEST_EMAIL_2 ?? "" },
                    dbConnection: conn,
                } as unknown as Request,
                res
            );

            expect(res.sendStatus).toHaveBeenCalledWith(201);

            const m = await conn.manager.findOne(Membership, {
                user_id: user.id,
            });

            expect(m).not.toBe(undefined);
        });

        test("Invited user has been invited already, should update and resend", async () => {
            const user = await conn.manager.findOneOrFail(User, {
                where: { email: process.env.TEST_EMAIL_2 ?? "" },
            });
            const mStart = await conn.manager.findOneOrFail(Membership, {
                user_id: user.id,
            });

            await sleep(2000);

            await sendInviteController(
                {
                    session: {
                        user_id,
                        current_business_id: business_id,
                        business_ids: [business_id],
                    },
                    body: { email: process.env.TEST_EMAIL_2 ?? "" },
                    dbConnection: conn,
                } as unknown as Request,
                res
            );

            expect(res.sendStatus).toHaveBeenCalledWith(201);

            const mEnd = await conn.manager.findOneOrFail(Membership, {
                user_id: user.id,
            });

            expect(mEnd.token_expiry?.getTime() ?? -Infinity).toBeGreaterThan(
                mStart.token_expiry?.getTime() ?? Infinity
            );
            expect(mEnd.token).not.toEqual(mStart.token);
        });
    });
});
