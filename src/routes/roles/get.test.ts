import { getMockRes } from "@jest-mock/express";
import Department from "@models/department";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { deepClone } from "@util/obj";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import { Request, Response } from "express";
import getController from "./get";
import Role, { AccessKey } from "@models/role";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number;
let conn: Connection;
let session: Omit<SessionData, "cookie">;
const name = "Demo";

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();

    ({ business_id, user_id } = await setupAdmin(conn));

    session = {
        user_id,
        business_ids: [business_id],
        current_business_id: business_id,
    };

    await conn.manager.insert(
        Role,
        new Role({
            name,
            department_id: (
                await conn.manager.findOneOrFail<Department>(Department)
            ).id,
            updated_by_user_id: user_id,
        })
    );
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});
describe("sort", () => {
    const cases = [
        { sort_field: "name", sort_order: "ASC" },
        { sort_field: "name", sort_order: "DESC" },
        { sort_field: "num_members", sort_order: "ASC" },
        { sort_field: "num_members", sort_order: "DESC" },
        { sort_field: "department_name", sort_order: "ASC" },
        { sort_field: "department_name", sort_order: "DESC" },
    ];

    test.each(cases)(
        "given sort field %p and sort order %p, the results will match",
        async ({ sort_field, sort_order }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let data: { [x: string]: any }[] = [];

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
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                data: { [x: string]: any }[];
                                count: number;
                            }) => {
                                data = u.data;
                            },
                        };
                    },
                    send: (u: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        data: { [x: string]: any }[];
                        count: number;
                    }) => {
                        data = u.data;
                    },
                } as unknown as Response
            );
            expect(data.length).toBeGreaterThan(1);
            const dataCopy = deepClone(data);
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

            expect(JSON.stringify(data)).toBe(JSON.stringify(sortedData));
        }
    );
});

describe("search", () => {
    const cases = [
        {
            search: "dem",
        },
    ];

    test.each(cases)("%p", async ({ search }) => {
        let status;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let send: any;
        await getController(
            {
                query: { search },
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
        expect(send.data.length).toBe(1);
        expect((send.data[0].name as string).toLowerCase()).toContain(
            search.toLowerCase()
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
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ length: 1 }),
                })
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
            expect(send.data.length).toBe(limit);
        });
    });
});

test("filter", async () => {
    const { id } = await conn.manager.findOneOrFail(Department);
    await getController(
        {
            session,
            query: {
                filter_field: "department",
                filter_ids: JSON.stringify([id + 1]),
            },
            dbConnection: conn,
        } as unknown as Request,
        res
    );
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
            data: expect.objectContaining({ length: 0 }),
        })
    );
});

describe("permissions", () => {
    const cases = [
        { access: "ADMIN" },
        { access: "MANAGER" },
        { access: "USER" },
    ];

    describe.each(cases)("%p", ({ access }) => {
        beforeAll(async () => {
            await conn.manager.update(Role, () => "", {
                access: access as AccessKey,
                prevent_edit: false,
            });
        });
        afterAll(async () => {
            await conn.manager.update(Role, () => "", {
                access: "ADMIN",
                prevent_edit: true,
            });
        });
        test(access !== "USER" ? "success" : "fail", async () => {
            await getController(
                {
                    session,
                    query: {},
                    dbConnection: conn,
                } as unknown as Request,
                res
            );
            if (access === "USER")
                expect(res.sendStatus).toHaveBeenCalledWith(403);
            else expect(res.status).toBeCalledWith(200);
            return;
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
