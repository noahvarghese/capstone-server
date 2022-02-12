import { getMockRes } from "@jest-mock/express";
import Department from "@models/department";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { Connection } from "typeorm";
import postController from "./post";

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

describe("invalid body", () => {
    const cases = [
        { name: 123, department_id: 10000 },
        { name: "", department_id: NaN },
        { name: " ", department_id: "" },
        { name: NaN, department_id: " " },
        { name: undefined, department_id: "yolo" },
        { name: null, department_id: undefined },
    ];

    test.each(cases)("%p", async (body) => {
        await postController(
            {
                session: {
                    user_id,
                    current_business_id: business_id,
                    business_ids: [business_id],
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

    const name = "TEST";

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
            await conn.manager.delete(Role, { name });
        });

        test(access === "ADMIN" ? "success" : "fail", async () => {
            await postController(
                {
                    session: {
                        user_id,
                        current_business_id: business_id,
                        business_ids: [business_id],
                    },
                    body: {
                        name,
                        department_id: (
                            await conn.manager.findOneOrFail(Department)
                        ).id,
                    },
                    dbConnection: conn,
                } as unknown as Request,
                res
            );

            if (access === "ADMIN") {
                expect(res.sendStatus).toHaveBeenCalledWith(201);
                expect(
                    await conn.manager.findOneOrFail(Role, {
                        where: { name },
                    })
                ).toBeTruthy();
            } else {
                expect(res.sendStatus).toHaveBeenCalledWith(403);
            }
        });
    });
});
