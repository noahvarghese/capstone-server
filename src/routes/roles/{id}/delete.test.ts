import { getMockRes } from "@jest-mock/express";
import Department from "@models/department";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { Connection } from "typeorm";
import deleteController from "./delete";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number;
let conn: Connection;

let id: number, department_id: number;
const name = "TEST";

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();
    ({ business_id, user_id } = await setupAdmin(await DBConnection.get()));

    const dept = await conn.manager.findOneOrFail(Department);
    department_id = dept.id;

    ({
        identifiers: [{ id }],
    } = await conn.manager.insert(
        Role,
        new Role({
            name,
            department_id,
            updated_by_user_id: user_id,
        })
    ));
});

afterAll(async () => {
    const conn = await DBConnection.get();
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("prevent delete", () => {
    beforeAll(async () => {
        await conn.manager.update(Role, { id }, { prevent_delete: true });
    });

    afterAll(async () => {
        await conn.manager.update(Role, { id }, { prevent_delete: false });
    });

    test("405", async () => {
        await deleteController(
            {
                session: {
                    user_id,
                    current_business_id: business_id,
                    business_ids: [business_id],
                },
                params: { id },
                dbConnection: conn,
            } as unknown as Request,
            res
        );

        expect(res.sendStatus).toHaveBeenCalledWith(405);
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
            await conn.manager.insert(Role, {
                name,
                department_id,
                updated_by_user_id: user_id,
            });
        });

        test(access === "ADMIN" ? "success" : "fail", async () => {
            await deleteController(
                {
                    session: {
                        user_id,
                        current_business_id: business_id,
                        business_ids: [business_id],
                    },
                    params: { id },
                    dbConnection: conn,
                } as unknown as Request,
                res
            );

            if (access === "ADMIN") {
                expect(res.sendStatus).toHaveBeenCalledWith(200);
                expect(
                    (
                        await conn.manager.find(Role, {
                            where: { id },
                        })
                    ).length
                ).toBe(0);
            } else {
                expect(res.sendStatus).toHaveBeenCalledWith(403);
            }
        });
    });
});
