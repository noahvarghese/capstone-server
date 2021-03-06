import { getMockRes } from "@jest-mock/express";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import getController from "./get";
import { Request, Response } from "express";
import { deepClone } from "@util/obj";
import Manual from "@models/manual/manual";
import ManualAssignment from "@models/manual/assignment";
import Quiz from "@models/quiz/quiz";
import Department from "@models/department";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

let business_id: number,
    user_id: number,
    role_id: number,
    department_id: number,
    manual_id: number;
const quiz_ids: number[] = [];
let conn: Connection;
let session: Omit<SessionData, "cookie">;

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();

    ({ business_id, user_id } = await setupAdmin(conn));

    session = {
        user_id,
        business_ids: [business_id],
        current_business_id: business_id,
    };

    ({
        identifiers: [{ id: manual_id }],
    } = await conn.manager.insert(
        Manual,
        new Manual({
            title: "TEST",
            prevent_delete: false,
            prevent_edit: false,
            published: true,
            updated_by_user_id: user_id,
            business_id,
        })
    ));
    let {
        identifiers: [{ id }],
    } = await conn.manager.insert(
        Quiz,
        new Quiz({
            title: "TEST",
            prevent_delete: false,
            prevent_edit: false,
            published: true,
            max_attempts: 1,
            manual_id,
            updated_by_user_id: user_id,
        })
    );

    quiz_ids.push(id);
    ({
        identifiers: [{ id }],
    } = await conn.manager.insert(
        Quiz,
        new Quiz({
            title: "TEST123",
            prevent_delete: false,
            prevent_edit: false,
            published: true,
            max_attempts: 1,
            manual_id,
            updated_by_user_id: user_id,
        })
    ));

    quiz_ids.push(id);

    role_id = (await conn.manager.findOneOrFail(Role)).id;
    department_id = (await conn.manager.findOneOrFail(Department)).id;

    await conn.manager.insert(
        ManualAssignment,
        new ManualAssignment({
            manual_id,
            updated_by_user_id: user_id,
            role_id,
        })
    );
});

afterAll(async () => {
    await conn.manager.delete(Manual, () => "");
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("sort", () => {
    const cases = [
        { sort_field: "title", sort_order: "ASC" },
        { sort_field: "title", sort_order: "DESC" },
    ];

    test.each(cases)(
        "given sort field %p and sort order %p, the results will match",
        async ({ sort_field, sort_order }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let data: { count: number; data: { [x: string]: any }[] } = {
                count: 0,
                data: [],
            };

            await getController(
                {
                    session,
                    query: { sort_field, sort_order },
                    dbConnection: conn,
                } as unknown as Request,
                {
                    status: () => {
                        return {
                            send: (u: {
                                count: number;
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                data: { [x: string]: any }[];
                            }) => {
                                data = u;
                            },
                        };
                    },
                    send: (u: {
                        count: number;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        data: { [x: string]: any }[];
                    }) => {
                        data = u;
                    },
                } as unknown as Response
            );
            expect(data.data.length).toBeGreaterThan(1);
            const dataCopy = deepClone(data.data);
            expect(dataCopy).toBeInstanceOf(Array);
            const sortedData = dataCopy.sort((a, b): number => {
                const aVal = JSON.stringify(a[sort_field]);
                const bVal = JSON.stringify(b[sort_field]);

                if (sort_order === "ASC") {
                    return aVal < bVal ? -1 : aVal === bVal ? 0 : 1;
                } else {
                    return aVal < bVal ? 1 : aVal === bVal ? 0 : -1;
                }
            });

            expect(JSON.stringify(data.data)).toBe(JSON.stringify(sortedData));
        }
    );
});

describe("search", () => {
    const cases = [
        {
            search: "123",
        },
    ];

    test.each(cases)("%p", async ({ search }) => {
        await getController(
            {
                query: { search },
                session,
                dbConnection: conn,
            } as unknown as Request,
            res
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            count: expect.any(Number),
            data: expect.objectContaining({ length: 1 }),
        });
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                count: expect.any(Number),
                data: expect.arrayContaining([
                    expect.objectContaining({
                        title: expect.stringContaining(search.toLowerCase()),
                    }),
                ]),
            })
        );
    });
});

describe("pagination", () => {
    describe("page", () => {
        const cases = [
            { limit: 1, page: 1 },
            { limit: 1, page: 2 },
        ];
        test.each(cases)("%p", async ({ limit, page }) => {
            const conn = await DBConnection.get();
            await getController(
                {
                    query: { limit, page },
                    session,
                    dbConnection: conn,
                } as unknown as Request,
                res
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                count: expect.any(Number),
                data: expect.objectContaining({ length: 1 }),
            });
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
                    session,
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
            expect(send.data.length).toBeLessThanOrEqual(limit);
        });
    });
});

describe("filter", () => {
    const cases = [
        { id: department_id, field: "department" },
        { id: role_id, field: "role" },
        { id: manual_id, field: "manual" },
    ];
    test.each(cases)("%p", async ({ id, field }) => {
        await getController(
            {
                session,
                query: {
                    filter_field: field,
                    filter_ids: JSON.stringify([id + 1]),
                },
                dbConnection: conn,
            } as unknown as Request,
            res
        );
        expect(res.send).toHaveBeenCalledWith(
            // FIXME: Not sure why it returns an empty array
            expect.objectContaining({ count: 0 })
        );
    });
});

describe("user not assigned", () => {
    beforeAll(async () => {
        await conn.manager.delete(ManualAssignment, {
            manual_id,
            role_id,
        });
        await conn.manager.update(Role, role_id, {
            access: "USER",
            prevent_edit: false,
        });
    });

    afterAll(async () => {
        await conn.manager.insert(ManualAssignment, {
            manual_id,
            role_id,
            updated_by_user_id: user_id,
        });
        await conn.manager.update(Role, role_id, {
            access: "ADMIN",
            prevent_edit: true,
        });
    });

    test("", async () => {
        await getController(
            {
                session,
                query: {},
                dbConnection: conn,
            } as unknown as Request,
            res
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({ count: 0 })
        );
    });
});

describe("manual published", () => {
    const mPublished = [true, false];
    describe.each(mPublished)("%p", (mP) => {
        const qPublished = [true, false];
        beforeAll(async () => {
            await conn.manager.update(Manual, manual_id, { published: mP });
        });

        describe.each(qPublished)("%p", (p) => {
            const permissions = ["ADMIN", "MANAGER", "USER"];
            beforeAll(async () => {
                Promise.all(
                    quiz_ids.map((q) =>
                        conn.manager.update(Quiz, q, {
                            published: p,
                        })
                    )
                );
            });
            describe.each(permissions)("permissions %p", (access) => {
                beforeAll(async () => {
                    await conn.manager.update(Role, role_id, {
                        access: access as AccessKey,
                        prevent_edit: false,
                    });
                });
                afterAll(async () => {
                    await conn.manager.update(Role, role_id, {
                        access: "ADMIN",
                        prevent_edit: true,
                    });
                });

                test("", async () => {
                    await getController(
                        {
                            session,
                            query: {},
                            dbConnection: conn,
                        } as unknown as Request,
                        res
                    );

                    expect(res.status).toHaveBeenCalledWith(200);

                    if (access === "USER" && (p === false || mP === false)) {
                        expect(res.send).toHaveBeenCalledWith(
                            expect.objectContaining({ count: 0 })
                        );
                    } else {
                        expect(res.send).toHaveBeenCalledWith(
                            expect.objectContaining({ count: 2 })
                        );
                    }
                });
            });
        });
    });
});

describe("invalid query params", () => {
    describe("pagination", () => {
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
                    session,
                    dbConnection: conn,
                } as unknown as Request,
                res
            );
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith("Invalid pagination options");
        });
    });

    describe("filter", () => {
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
        test.each(cases)("%p", async ({ filter_field, filter_ids }) => {
            const conn = await DBConnection.get();
            await getController(
                {
                    query: { filter_field, filter_ids },
                    session,
                    dbConnection: conn,
                } as unknown as Request,
                res
            );
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith("Invalid filter options");
        });
    });

    describe("sort", () => {
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
            { sort_field: "yolo", sort_order: "ASC" },
        ];
        test.each(cases)("%p", async ({ sort_field, sort_order }) => {
            const conn = await DBConnection.get();
            await getController(
                {
                    query: { sort_field, sort_order },
                    session,
                    dbConnection: conn,
                } as unknown as Request,
                res
            );
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith("Invalid sort options");
        });
    });
});
