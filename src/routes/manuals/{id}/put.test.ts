import { getMockRes } from "@jest-mock/express";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import putController from "./put";

let business_id: number, user_id: number, manual_id: number;
let conn: Connection;
let session: Omit<SessionData, "cookie">;
const NEW_NAME = "NEW_NAME";
const OLD_NAME = "OLD_NAME";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();

    ({ business_id, user_id } = await setupAdmin(conn));

    const { id: role_id } = await conn.manager.findOneOrFail(Role);

    session = {
        user_id,
        business_ids: [business_id],
        current_business_id: business_id,
    };

    ({
        identifiers: [{ id: manual_id }],
    } = await conn.manager.insert(
        Manual,
        new Manual({
            updated_by_user_id: user_id,
            prevent_delete: false,
            prevent_edit: false,
            published: false,
            title: OLD_NAME,
        })
    ));

    await conn.manager.insert(
        ManualAssignment,
        new ManualAssignment({
            updated_by_user_id: user_id,
            role_id,
            manual_id,
        })
    );
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("prevent edit", () => {
    const cases = [true, false];
    beforeAll(async () => {
        await conn.manager.update(Manual, manual_id, { prevent_edit: true });
    });
    afterAll(async () => {
        await conn.manager.update(Manual, manual_id, {
            prevent_edit: false,
            title: OLD_NAME,
        });
    });

    test.each(cases)("prevent edit: %p", async (prevent_edit) => {
        await putController(
            {
                session,
                dbConnection: conn,
                params: { id: manual_id },
                body: { title: NEW_NAME, prevent_edit },
            } as unknown as Request,
            res
        );

        const mans = await conn.manager.find(Manual);

        if (prevent_edit) {
            expect(res.sendStatus).toHaveBeenCalledWith(405);
            expect(mans[0].title).toBe(OLD_NAME);
        } else {
            expect(res.sendStatus).toHaveBeenCalledWith(200);
            expect(mans[0].title).toBe(NEW_NAME);
        }
    });
});

describe("Permissions", () => {
    const cases = ["ADMIN", "MANAGER", "USER"];

    afterEach(async () => {
        await conn.manager.update(Role, () => "", {
            access: "ADMIN",
            prevent_edit: true,
        });
        await conn.manager.update(Manual, manual_id, { title: OLD_NAME });
    });

    test.each(cases)("%p", async (access) => {
        await conn.manager.update(Role, () => "", {
            access: access as AccessKey,
            prevent_edit: false,
        });

        await putController(
            {
                session,
                dbConnection: conn,
                body: { title: NEW_NAME },
                params: { id: manual_id },
            } as unknown as Request,
            res
        );

        const mans = await conn.manager.find(Manual);

        if (access !== "USER") {
            expect(res.sendStatus).toHaveBeenCalledWith(200);
            expect(mans[0].title).toBe(NEW_NAME);
        } else {
            expect(res.sendStatus).toHaveBeenCalledWith(403);
            expect(mans[0].title).toBe(OLD_NAME);
        }
    });
});
