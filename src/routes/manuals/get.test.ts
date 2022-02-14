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

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number, role_id: number;
const manual_ids: number[] = [];
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

    let {
        identifiers: [{ id }],
    } = await conn.manager.insert(
        Manual,
        new Manual({
            title: "TEST",
            prevent_delete: false,
            prevent_edit: false,
            published: true,
            updated_by_user_id: user_id,
        })
    );

    manual_ids.push(id);
    ({
        identifiers: [{ id }],
    } = await conn.manager.insert(
        Manual,
        new Manual({
            title: "TEST123",
            prevent_delete: false,
            prevent_edit: false,
            published: true,
            updated_by_user_id: user_id,
        })
    ));

    manual_ids.push(id);

    role_id = (await conn.manager.findOneOrFail<Role>(Role)).id;

    for (const manual_id of manual_ids) {
        await conn.manager.insert(
            ManualAssignment,
            new ManualAssignment({
                manual_id,
                updated_by_user_id: user_id,
                role_id,
            })
        );
    }
});

afterAll(async () => {
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
            search: "123",
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
        expect(send.length).toBe(1);
        expect((send[0].title as string).toLowerCase()).toContain(
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
            expect(send.length).toBe(limit);
        });
    });
});

describe("filter", () => {
    test.todo("");
});

describe("published", () => {
    const published = [true, false];
    describe.each(published)("%p", (p) => {
        const permissions = ["ADMIN", "MANAGER", "USER"];
        beforeAll(async () => {
            Promise.all(
                manual_ids.map((m) =>
                    conn.manager.update(Manual, m, {
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

                if (access === "USER" && p === false) {
                    expect(res.send).toHaveBeenCalledWith(
                        expect.objectContaining({ length: 0 })
                    );
                } else {
                    expect(res.send).toHaveBeenCalledWith(
                        expect.objectContaining({ length: 2 })
                    );
                }
            });
        });
    });
});
