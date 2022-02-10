import { getMockRes } from "@jest-mock/express";
import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import {
    departmentAttributes,
    roleAttributes,
    userAttributes,
} from "@test/model/attributes";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import getController from "./get";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

test("db connection failed", async () => {
    await getController({ query: {}, session: {} } as Request, res);
    expect(res.sendStatus).toHaveBeenCalledWith(500);
});

describe("requires db connection", () => {
    beforeAll(DBConnection.init);
    afterAll(DBConnection.close);

    describe("requires admin user", () => {
        let business_id: number, user_id: number;

        beforeAll(async () => {
            // Create admin user
            ({ business_id, user_id } = await setupAdmin(
                await DBConnection.get()
            ));
        });

        afterAll(async () => {
            const conn = await DBConnection.get();
            await unitTeardown(conn);
        });

        test("admin read", async () => {
            const conn = await DBConnection.get();

            const business_id: number = (
                await conn.manager.findOneOrFail(Business)
            ).id;

            user_id = (
                await conn.manager.findOneOrFail(User, {
                    where: { email: process.env.TEST_EMAIL_1 },
                })
            ).id;

            await getController(
                {
                    query: {},
                    session: {
                        user_id,
                        current_business_id: business_id,
                        business_ids: [business_id],
                    },
                    dbConnection: conn,
                } as Request,
                res
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        describe("requires secondary user", () => {
            beforeAll(async () => {
                // create secondary user/department/role/user role
                const conn = await DBConnection.get();
                const [
                    {
                        identifiers: [{ id: secondaryUserId }],
                    },
                    {
                        identifiers: [{ id: department_id }],
                    },
                ] = await Promise.all([
                    conn.manager.insert(
                        User,
                        new User({
                            first_name: userAttributes().first_name,
                            last_name: userAttributes().last_name,
                            email: process.env.TEST_EMAIL_2 ?? "",
                        })
                    ),
                    conn.manager.insert(
                        Department,
                        new Department({
                            name: departmentAttributes().name,
                            business_id,
                            updated_by_user_id: user_id,
                        })
                    ),
                ]);

                await conn.manager.insert(
                    Membership,
                    new Membership({
                        user_id: secondaryUserId,
                        updated_by_user_id: user_id,
                        business_id,
                        accepted: true,
                        default_option: true,
                    })
                );
                const {
                    identifiers: [{ id: role_id }],
                } = await conn.manager.insert(
                    Role,
                    new Role({
                        updated_by_user_id: user_id,
                        department_id,
                        access: "USER",
                        name: roleAttributes().name,
                    })
                );

                await conn.manager.insert(
                    UserRole,
                    new UserRole({
                        user_id: secondaryUserId,
                        role_id,
                        updated_by_user_id: user_id,
                    })
                );
                return;
            });

            describe("permissions", () => {
                test("manager", async () => {
                    const conn = await DBConnection.get();
                    await conn.manager.update(
                        Role,
                        { access: "USER" },
                        { access: "MANAGER" }
                    );

                    await getController(
                        {
                            query: {},
                            session: {
                                user_id: (
                                    await conn.manager.findOneOrFail(User, {
                                        where: {
                                            email: process.env.TEST_EMAIL_2,
                                        },
                                    })
                                ).id,
                                current_business_id: business_id,
                                business_ids: [business_id],
                            },
                            dbConnection: conn,
                        } as Request,
                        res
                    );
                    expect(res.sendStatus).not.toHaveBeenCalledWith(500);
                    expect(res.sendStatus).not.toHaveBeenCalledWith(400);
                    expect(res.sendStatus).not.toHaveBeenCalledWith(403);
                    expect(res.status).toHaveBeenCalledWith(200);
                });
                test.todo("none");
            });

            describe("pagination", () => {
                test.todo("limit");
                test.todo("page");
            });

            describe("filter", () => {
                return;
            });

            describe("search", () => {
                return;
            });

            describe("sort", () => {
                return;
            });
        });
    });
});
