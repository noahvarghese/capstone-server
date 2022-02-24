import { getMockRes } from "@jest-mock/express";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import getController from "./get";

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
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

// currently only 1 question type

describe("can retrieve all question types", () => {
    const cases: AccessKey[] = ["ADMIN", "MANAGER", "USER"];

    afterEach(async () => {
        await conn.manager.update(Role, () => "", {
            access: "ADMIN",
            prevent_edit: true,
        });
    });

    test.each(cases)("permissions: %p", async (access) => {
        await conn.manager.update(Role, () => "", {
            access,
            prevent_edit: false,
        });

        await getController(
            { session, dbConnection: conn } as unknown as Request,
            res
        );

        if (access !== "USER") {
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        question_type: "multiple choice",
                        html_tag: "input",
                    }),
                ])
            );
        } else {
            expect(res.sendStatus).toHaveBeenCalledWith(403);
        }
    });
});
