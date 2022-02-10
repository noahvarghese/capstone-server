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
import { Request, Response } from "express";
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

                test("none", async () => {
                    const conn = await DBConnection.get();
                    await conn.manager.update(
                        Role,
                        { access: "MANAGER" },
                        { access: "USER" }
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
                    expect(res.status).not.toHaveBeenCalledWith(200);
                    expect(res.sendStatus).toHaveBeenCalledWith(403);
                });
            });

            describe("pagination", () => {
                describe("invalid", () => {
                    const cases = [
                        { limit: "yolo", page: 1 },
                        { limit: " ", page: 1 },
                        { limit: false, page: 1 },
                        { limit: true, page: 1 },
                        { limit: {}, page: 1 },
                        { limit: { test: "" }, page: 1 },
                        { limit: "", page: 1 },
                        { limit: undefined, page: 1 },
                        { limit: null, page: 1 },
                        { page: "yolo", limit: 1 },
                        { page: " ", limit: 1 },
                        { page: false, limit: 1 },
                        { page: true, limit: 1 },
                        { page: {}, limit: 1 },
                        { page: { test: "" }, limit: 1 },
                        { page: "", limit: 1 },
                        { page: undefined, limit: 1 },
                        { page: null, limit: 1 },
                        { limit: 1 },
                        { page: 1 },
                    ];

                    test.each(cases)("%p", async ({ limit, page }) => {
                        const conn = await DBConnection.get();
                        await getController(
                            {
                                query: { limit, page },
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
                            } as unknown as Request,
                            res
                        );
                        expect(res.status).toHaveBeenCalledWith(400);
                        expect(res.send).toHaveBeenCalledWith(
                            "Invalid pagination options"
                        );
                    });
                });

                describe("page", () => {
                    const cases = [
                        { limit: 1, page: 1, email: process.env.TEST_EMAIL_2 },
                        { limit: 1, page: 2, email: process.env.TEST_EMAIL_1 },
                    ];
                    test.each(cases)("%p", async ({ limit, page, email }) => {
                        const conn = await DBConnection.get();
                        await getController(
                            {
                                query: { limit, page },
                                session: {
                                    user_id,
                                    current_business_id: business_id,
                                    business_ids: [business_id],
                                },
                                dbConnection: conn,
                            } as unknown as Request,
                            res
                        );
                        expect(res.status).toHaveBeenCalledWith(200);
                        expect(res.send).toHaveBeenCalledWith(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    email,
                                }),
                            ])
                        );
                    });
                });

                describe("limit", () => {
                    const cases = [
                        { limit: 1, page: 1 },
                        { limit: 2, page: 1 },
                    ];
                    test.each(cases)("%p", async ({ limit, page }) => {
                        const conn = await DBConnection.get();
                        let status;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        let send: any;
                        await getController(
                            {
                                query: { limit, page },
                                session: {
                                    user_id,
                                    current_business_id: business_id,
                                    business_ids: [business_id],
                                },
                                dbConnection: conn,
                            } as unknown as Request,
                            {
                                send: (v: unknown) => {
                                    send = v;
                                },
                                status: (v: unknown) => {
                                    status = v;
                                    return {
                                        send: (v: unknown) => {
                                            send = v;
                                        },
                                    };
                                },
                            } as Response
                        );
                        expect(status).toBe(200);
                        expect(send.length).toBe(limit);
                    });
                });
            });

            describe("filter", () => {
                describe("invalid", () => {
                    const cases = [
                        { filter_field: "", filter_ids: "[]" },
                        { filter_field: "role", filter_ids: "[]" },
                        { filter_field: "department", filter_ids: "[]" },
                        { filter_field: "test", filter_ids: "[1]" },
                        { filter_field: undefined, filter_ids: "[1]" },
                        { filter_field: null, filter_ids: "[1]" },
                        { filter_field: {}, filter_ids: "[1]" },
                        { filter_field: { test: "" }, filter_ids: "[1]" },
                        { filter_field: 1, filter_ids: "[1]" },
                        { filter_field: NaN, filter_ids: "[1]" },
                        { filter_field: " ", filter_ids: "[1]" },
                        { filter_field: "role", filter_ids: "" },
                        { filter_field: "role", filter_ids: null },
                        { filter_field: "role", filter_ids: undefined },
                        { filter_field: "role", filter_ids: " " },
                        { filter_field: "department", filter_ids: {} },
                        {
                            filter_field: "department",
                            filter_ids: { test: "" },
                        },
                    ];
                    test.each(cases)(
                        "%p",
                        async ({ filter_field, filter_ids }) => {
                            const conn = await DBConnection.get();
                            await getController(
                                {
                                    query: { filter_field, filter_ids },
                                    session: {
                                        user_id,
                                        current_business_id: business_id,
                                        business_ids: [business_id],
                                    },
                                    dbConnection: conn,
                                } as unknown as Request,
                                res
                            );
                            expect(res.status).toHaveBeenCalledWith(400);
                            expect(res.send).toHaveBeenCalledWith(
                                "Invalid filter options"
                            );
                        }
                    );
                });
            });

            describe("search", () => {
                const cases = [
                    {
                        search: "man",
                        partial: {
                            roles: [{ department: { name: "Management" } }],
                        },
                    },
                ];
                test.each(cases)("%p", async ({ search, partial }) => {
                    const conn = await DBConnection.get();
                    let status;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let send: any;
                    await getController(
                        {
                            query: { search },
                            session: {
                                user_id,
                                current_business_id: business_id,
                                business_ids: [business_id],
                            },
                            dbConnection: conn,
                        } as unknown as Request,
                        {
                            send: (v: unknown) => {
                                send = v;
                            },
                            status: (v: unknown) => {
                                status = v;
                                return {
                                    send: (v: unknown) => {
                                        send = v;
                                    },
                                };
                            },
                        } as Response
                    );
                    expect(status).toBe(200);
                    expect(send.length).toBe(1);
                    expect(send[0].roles[0].department.name).toBe(
                        partial.roles[0].department.name
                    );
                });
            });

            describe("sort", () => {
                describe("invalid", () => {
                    const cases = [
                        { sort_field: "", sort_order: "ASC" },
                        { sort_field: "", sort_order: "DESC" },
                        { sort_field: "", sort_order: "YOLO" },
                        { sort_field: "first_name", sort_order: "" },
                        { sort_field: "last_name", sort_order: " " },
                        { sort_field: "email", sort_order: 1 },
                        { sort_field: "phone", sort_order: NaN },
                        { sort_field: "department", sort_order: null },
                        { sort_field: "role", sort_order: undefined },
                    ];
                    test.each(cases)(
                        "%p",
                        async ({ sort_field, sort_order }) => {
                            const conn = await DBConnection.get();
                            await getController(
                                {
                                    query: { sort_field, sort_order },
                                    session: {
                                        user_id: (
                                            await conn.manager.findOneOrFail(
                                                User,
                                                {
                                                    where: {
                                                        email: process.env
                                                            .TEST_EMAIL_2,
                                                    },
                                                }
                                            )
                                        ).id,
                                        current_business_id: business_id,
                                        business_ids: [business_id],
                                    },
                                    dbConnection: conn,
                                } as unknown as Request,
                                res
                            );
                            expect(res.status).toHaveBeenCalledWith(400);
                            expect(res.send).toHaveBeenCalledWith(
                                "Invalid sort options"
                            );
                            return;
                        }
                    );
                });
            });
        });
    });
});
