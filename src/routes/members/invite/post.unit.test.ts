import { getMockRes } from "@jest-mock/express";
import Business from "@models/business";
import Department from "@models/department";
import Event from "@models/event";
import Membership from "@models/membership";
import MembershipRequest from "@models/membership_request";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import DBConnection from "@test/support/db_connection";
import sleep from "@util/sleep";
import { Request } from "express";
import { Connection } from "typeorm";
import { sendInviteController } from "./post_controller";
import { postHandler } from "./post_handler";

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
    let user_id!: number,
        business_id!: number,
        permission_id!: number,
        conn!: Connection;

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
            conn.manager.insert(User, new User({ email: "test@test.com" })),
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
            {
                identifiers: [{ id }],
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
            conn.manager.insert(
                Permission,
                new Permission({
                    global_crud_users: true,
                    updated_by_user_id: user_id,
                })
            ),
        ]);

        permission_id = id;

        const {
            identifiers: [{ id: role_id }],
        } = await conn.manager.insert(
            Role,
            new Role({
                department_id,
                permission_id,
                updated_by_user_id: user_id,
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
            conn.manager.delete(MembershipRequest, () => ""),
        ]);
        await conn.manager.delete(Role, () => "");
        await Promise.all([
            conn.manager.delete(Permission, () => ""),
            conn.manager.delete(Department, () => ""),
            conn.manager.delete(Membership, () => ""),
        ]);
        await Promise.all([
            conn.manager.delete(User, () => ""),
            conn.manager.delete(Business, () => ""),
        ]);

        await DBConnection.close();
    });

    test("user doesnt have global crud permissions for users", async () => {
        await conn.manager.update(Permission, permission_id, {
            global_crud_users: false,
        });

        await sendInviteController(
            {
                session: {
                    user_id,
                    current_business_id: business_id,
                    business_ids: [business_id],
                },
                body: { email: process.env.MAIL_USER ?? "" },
                dbConnection: conn,
            } as unknown as Request,
            res
        );

        await conn.manager.update(Permission, permission_id, {
            global_crud_users: true,
        });

        expect(res.sendStatus).toHaveBeenCalledWith(403);
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
                    body: { email: process.env.MAIL_USER ?? "" },
                    dbConnection: conn,
                } as unknown as Request,
                res
            );

            expect(res.status).not.toHaveBeenCalled();
            expect(res.sendStatus).toHaveBeenCalledWith(201);
        });

        // Handler
        test("Invited user is new to system", async () => {
            // delete user
            let user = await conn.manager.findOneOrFail(User, {
                where: { email: process.env.MAIL_USER ?? "" },
            });

            await conn.manager.clear(Event);
            await conn.manager.delete(MembershipRequest, {
                user_id: user.id,
            });
            await conn.manager.delete(User, {
                id: user.id,
            });

            let errorThrown = false;

            try {
                await postHandler(
                    conn,
                    { email: process.env.MAIL_USER ?? "" },
                    user_id,
                    business_id
                );
            } catch (_e) {
                errorThrown = true;
            }

            expect(errorThrown).toBe(false);

            user = await conn.manager.findOneOrFail(User, {
                where: { email: process.env.MAIL_USER ?? "" },
            });

            const m = await conn.manager.findOne(MembershipRequest, {
                user_id: user.id,
            });

            expect(m).not.toBe(undefined);
        });

        test("Invited user exists in system", async () => {
            // delete membership request
            const user = await conn.manager.findOneOrFail(User, {
                where: { email: process.env.MAIL_USER ?? "" },
            });

            await conn.manager.clear(Event);
            await conn.manager.delete(MembershipRequest, {
                user_id: user.id,
            });

            let errorThrown = false;

            try {
                await postHandler(
                    conn,
                    { email: process.env.MAIL_USER ?? "" },
                    user_id,
                    business_id
                );
            } catch (_e) {
                errorThrown = true;
            }

            expect(errorThrown).toBe(false);

            const m = await conn.manager.findOne(MembershipRequest, {
                user_id: user.id,
            });

            expect(m).not.toBe(undefined);
        });

        test("Invited user has been invited already, should update and resend", async () => {
            const user = await conn.manager.findOneOrFail(User, {
                where: { email: process.env.MAIL_USER ?? "" },
            });
            const mStart = await conn.manager.findOneOrFail(MembershipRequest, {
                user_id: user.id,
            });

            await sleep(2000);

            let errorThrown = false;

            try {
                await postHandler(
                    conn,
                    { email: process.env.MAIL_USER ?? "" },
                    user_id,
                    business_id
                );
            } catch (_e) {
                errorThrown = true;
            }

            expect(errorThrown).toBe(false);

            const mEnd = await conn.manager.findOneOrFail(MembershipRequest, {
                user_id: user.id,
            });

            expect(mEnd.token_expiry.getTime()).toBeGreaterThan(
                mStart.token_expiry.getTime()
            );
            expect(mEnd.token).not.toEqual(mStart.token);
        });
    });
});
