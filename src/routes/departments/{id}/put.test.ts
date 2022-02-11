import { getMockRes } from "@jest-mock/express";
import Department from "@models/department";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { Connection } from "typeorm";
import putController from "./put";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number;
let conn: Connection;

let id: number;
const oldName = "TEST";
const newName = "NEWTEST";

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();
    ({ business_id, user_id } = await setupAdmin(await DBConnection.get()));

    ({
        identifiers: [{ id }],
    } = await conn.manager.insert(
        Department,
        new Department({
            name: oldName,
            business_id,
            updated_by_user_id: user_id,
        })
    ));
});

afterAll(async () => {
    const conn = await DBConnection.get();
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("prevent edit", () => {
    beforeAll(async () => {
        await conn.manager.update(
            Department,
            { id, business_id },
            { prevent_edit: true }
        );
    });
    afterAll(async () => {
        await conn.manager.update(
            Department,
            { id, business_id },
            { prevent_edit: false }
        );
    });
    test("405", async () => {
        await putController(
            {
                session: {
                    user_id,
                    current_business_id: business_id,
                    business_ids: [business_id],
                },
                params: { id },
                body: { name: newName },
                dbConnection: conn,
            } as unknown as Request,
            res
        );

        expect(res.sendStatus).toHaveBeenCalledWith(405);
    });
});

describe("invalid id", () => {
    const cases = [{ id: "YOLO" }, { new_id: 10000 }];
    test.each(cases)("%p", async ({ new_id }) => {
        await putController(
            {
                session: {
                    user_id,
                    business_ids: [business_id],
                    current_business_id: business_id,
                },
                params: {
                    id: new_id,
                },
                body: { name: oldName },
                dbConnection: conn,
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenLastCalledWith(400);
    });
});

test("bad db connection", async () => {
    await putController(
        {
            session: { user_id, current_business_id: business_id },
            body: { name: "TEst" },
            params: {
                id,
            },
        } as unknown as Request,
        res
    );
    expect(res.sendStatus).toHaveBeenCalledWith(500);
});

describe("missing session", () => {
    const cases = [
        { user_id: undefined, current_business_id: 1 },
        { user_id: 1, current_business_id: undefined },
    ];

    test.each(cases)("%p", async (session) => {
        await putController(
            {
                session,
                params: {
                    id,
                },
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenCalledWith(401);
    });
});

describe("invalid name", () => {
    const cases = [
        { name: 123 },
        { name: "" },
        { name: " " },
        { name: NaN },
        { name: undefined },
        { name: null },
    ];

    test.each(cases)("%p", async (body) => {
        await putController(
            {
                session: {
                    user_id,
                    current_business_id: business_id,
                    business_ids: [business_id],
                },
                params: {
                    id,
                },
                body,
                dbConnection: conn,
            } as unknown as Request,
            res
        );
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("permissions", () => {
    const cases = [
        { access: "ADMIN" },
        { access: "MANAGER" },
        { access: "USER" },
    ];

    describe.each(cases)("%p", ({ access }) => {
        beforeEach(async () => {
            await conn.manager.update(Role, () => "", {
                access: access as AccessKey,
                prevent_edit: false,
            });
        });

        afterEach(async () => {
            await conn.manager.update(Role, () => "", {
                access: "ADMIN",
                prevent_edit: true,
            });
            await conn.manager.update(Department, { id }, { name: oldName });
        });

        test(access === "ADMIN" ? "success" : "fail", async () => {
            await putController(
                {
                    session: {
                        user_id,
                        current_business_id: business_id,
                        business_ids: [business_id],
                    },
                    params: { id },
                    body: { name: newName },
                    dbConnection: conn,
                } as unknown as Request,
                res
            );

            if (access === "ADMIN") {
                expect(res.sendStatus).toHaveBeenCalledWith(200);
                expect(
                    (
                        await conn.manager.findOneOrFail(Department, {
                            where: { id, business_id },
                        })
                    ).name
                ).toBe(newName);
            } else {
                expect(res.sendStatus).toHaveBeenCalledWith(403);
            }
        });
    });
});
