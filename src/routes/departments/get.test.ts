import getController from "./get";
import { Request, Response } from "express";
import DBConnection from "@test/support/db_connection";
import { getMockRes } from "@jest-mock/express";
import { Connection } from "typeorm";
import { setupAdmin } from "@test/unit/setup";
import Department from "@models/department";
import { departmentAttributes } from "@test/model/attributes";
import { unitTeardown } from "@test/unit/teardown";
import { deepClone } from "@util/obj";
import { SessionData } from "express-session";
import Role, { AccessKey } from "@models/role";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number;
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

    await conn.manager.insert(
        Department,
        new Department({
            name: departmentAttributes().name,
            business_id,
            updated_by_user_id: user_id,
        })
    );
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
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

describe("sort", () => {
    const cases = [
        { sort_field: "name", sort_order: "ASC" },
        { sort_field: "name", sort_order: "DESC" },
        { sort_field: "num_managers", sort_order: "ASC" },
        { sort_field: "num_managers", sort_order: "DESC" },
        { sort_field: "num_members", sort_order: "ASC" },
        { sort_field: "num_members", sort_order: "DESC" },
        { sort_field: "num_roles", sort_order: "ASC" },
        { sort_field: "num_roles", sort_order: "DESC" },
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
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            send: (u: { [x: string]: any }[]) => {
                                data = u;
                            },
                        };
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    send: (u: { [x: string]: any }[]) => {
                        data = u;
                    },
                } as unknown as Response
            );
            expect(data.length).toBeGreaterThan(1);
            const dataCopy = deepClone(data);
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

describe.skip("search", () => {
    const cases = [
        {
            search: "man",
        },
    ];
    test.each(cases)("%p", async ({ search }) => {
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
        expect(send[0].name).toBe(departmentAttributes().name);
    });
});

describe.skip("pagination", () => {
    beforeAll(async () => {
        // create second department
    });

    describe("page", () => {
        const cases = [
            { limit: 1, page: 1, email: process.env.TEST_EMAIL_2 },
            { limit: 1, page: 2, email: process.env.TEST_EMAIL_1 },
        ];
        test.each(cases)("%p", async ({ limit, page }) => {
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
                expect.objectContaining({ length: 1 })
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
