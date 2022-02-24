import { getMockRes } from "@jest-mock/express";
import Manual from "@models/manual/manual";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import postController from "./post";

let business_id: number, user_id: number;
let conn: Connection;
let session: Omit<SessionData, "cookie">;

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

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

describe("Permissions", () => {
    const cases = ["ADMIN", "MANAGER", "USER"];

    afterEach(async () => {
        await conn.manager.delete(Manual, () => "");
        await conn.manager.update(Role, () => "", {
            access: "ADMIN",
            prevent_edit: true,
        });
    });

    test.each(cases)("%p", async (access) => {
        await conn.manager.update(Role, () => "", {
            access: access as AccessKey,
            prevent_edit: false,
        });

        await postController(
            { session, dbConnection: conn, body: { title: "TEST" } } as Request,
            res
        );

        if (access !== "USER") {
            expect(res.sendStatus).toHaveBeenCalledWith(201);

            const mans = await conn.manager.find(Manual);
            expect(mans.length).toBe(1);
            expect(mans[0].published).toBe(false);
        } else {
            expect(res.sendStatus).toHaveBeenCalledWith(403);
        }
    });
});

test("invalid title", async () => {
    await postController(
        { session, dbConnection: conn, body: {} } as Request,
        res
    );

    expect(res.status).toHaveBeenCalledWith(400);
});
