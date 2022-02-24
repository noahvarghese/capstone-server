import { getMockRes } from "@jest-mock/express";
import Manual from "@models/manual/manual";
import ManualSection from "@models/manual/section";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import postController from "./post";

let business_id: number, user_id: number, manual_id: number, role_id: number;
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

    role_id = (await conn.manager.findOneOrFail<Role>(Role)).id;

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
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("prevent edit", () => {
    beforeAll(async () => {
        await conn.manager.update(Manual, manual_id, { prevent_edit: true });
    });
    afterAll(async () => {
        await conn.manager.update(Manual, manual_id, { prevent_edit: false });
    });

    test("", async () => {
        await postController(
            {
                session,
                dbConnection: conn,
                body: { title: "TEST" },
                params: { manual_id },
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenCalledWith(405);
    });
});

describe("Permissions", () => {
    const cases = ["ADMIN", "MANAGER", "USER"];

    afterEach(async () => {
        await conn.manager.delete(ManualSection, { manual_id });
        await conn.manager.update(Role, role_id, {
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
            {
                session,
                dbConnection: conn,
                body: { title: "TEST" },
                params: { manual_id },
            } as unknown as Request,
            res
        );

        if (access !== "USER") {
            expect(res.sendStatus).toHaveBeenCalledWith(201);

            const mans = await conn.manager.find(ManualSection);
            expect(mans.length).toBe(1);
        } else {
            expect(res.sendStatus).toHaveBeenCalledWith(403);
        }
    });
});

test("invalid title", async () => {
    await postController(
        {
            session,
            dbConnection: conn,
            body: {},
            params: { manual_id },
        } as unknown as Request,
        res
    );

    expect(res.status).toHaveBeenCalledWith(400);
});
