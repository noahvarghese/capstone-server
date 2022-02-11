import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import getController from "./get";
import { Request } from "express";
import { getMockRes } from "@jest-mock/express";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import Department from "@models/department";
import { Connection } from "typeorm";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number;
let conn: Connection;

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();
    ({ business_id, user_id } = await setupAdmin(await DBConnection.get()));
});

afterAll(async () => {
    const conn = await DBConnection.get();
    await unitTeardown(conn);
    await DBConnection.close();
});

test("bad connection", async () => {
    await getController(
        {
            session: {
                user_id,
                business_ids: [business_id],
                current_business_id: business_id,
            },
            params: {
                id: 1,
            },
        } as unknown as Request,
        res
    );
    expect(res.sendStatus).toHaveBeenLastCalledWith(500);
});

describe("invalid session", () => {
    const cases = [
        { user_id: undefined, current_business_id: 1, business_ids: [1] },
        { user_id: 1, current_business_id: undefined, business_ids: [1] },
    ];
    test.each(cases)("%p", async (session) => {
        await getController(
            {
                session,
                params: {
                    id: 1,
                },
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenLastCalledWith(500);
    });
});
describe("invalid id", () => {
    const cases = [{ id: "YOLO" }, { id: 10000 }];
    test.each(cases)("%p", async ({ id }) => {
        await getController(
            {
                session: {
                    user_id,
                    business_ids: [business_id],
                    current_business_id: business_id,
                },
                params: {
                    id,
                },
                dbConnection: conn,
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenLastCalledWith(400);
    });
});

describe("permissions", () => {
    const cases = [
        { access: "ADMIN", success: true },
        { access: "MANAGER", success: true },
        { access: "USER", success: false },
    ];
    test.each(cases)("%p", async ({ access }) => {
        const name = "Admin";
        await conn.manager.update(Role, () => "", {
            access: access as AccessKey,
            prevent_edit: false,
        });
        await getController(
            {
                session: {
                    user_id,
                    business_ids: [business_id],
                    current_business_id: business_id,
                },
                params: {
                    id: (
                        await conn.manager.findOneOrFail(Department, {
                            where: { name },
                        })
                    ).id,
                },
                dbConnection: conn,
            } as unknown as Request,
            res
        );

        if (access === "USER") {
            expect(res.sendStatus).toHaveBeenLastCalledWith(403);
        } else {
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ name })
            );
        }
    });
});
