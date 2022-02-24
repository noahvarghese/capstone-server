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
import deleteController from "./delete";

let business_id: number, user_id: number, manual_id: number, role_id: number;
let conn: Connection;
let session: Omit<SessionData, "cookie">;
const OLD_NAME = "OLD_NAME";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

const genManual = async () => {
    ({
        identifiers: [{ id: manual_id }],
    } = await conn.manager.insert(
        Manual,
        new Manual({
            updated_by_user_id: user_id,
            prevent_delete: false,
            prevent_edit: false,
            published: false,
            business_id,
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
};

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();

    ({ business_id, user_id } = await setupAdmin(conn));

    ({ id: role_id } = await conn.manager.findOneOrFail(Role));

    session = {
        user_id,
        business_ids: [business_id],
        current_business_id: business_id,
    };

    await genManual();
});

afterAll(async () => {
    await conn.manager.delete(Manual, () => "");
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("prevent delete", () => {
    beforeAll(async () => {
        await conn.manager.update(Manual, manual_id, { prevent_delete: true });
    });
    afterAll(async () => {
        await conn.manager.update(Manual, manual_id, {
            prevent_delete: false,
        });
    });

    test("prevent delete: %p", async () => {
        await deleteController(
            {
                session,
                dbConnection: conn,
                params: { manual_id },
            } as unknown as Request,
            res
        );

        const mans = await conn.manager.find(Manual);
        expect(res.sendStatus).toHaveBeenCalledWith(405);
        expect(mans.length).toBe(1);
    });
});

describe("Permissions", () => {
    const cases = ["ADMIN", "MANAGER", "USER"];

    afterEach(async () => {
        await conn.manager.update(Role, () => "", {
            access: "ADMIN",
            prevent_edit: true,
        });

        if (!(await conn.manager.findOne(Manual))) {
            await genManual();
        }
    });

    test.each(cases)("%p", async (access) => {
        await conn.manager.update(Role, () => "", {
            access: access as AccessKey,
            prevent_edit: false,
        });

        await deleteController(
            {
                session,
                dbConnection: conn,
                params: { manual_id },
            } as unknown as Request,
            res
        );

        const mans = await conn.manager.find(Manual);

        if (access !== "USER") {
            expect(res.sendStatus).toHaveBeenCalledWith(200);
            expect(mans.length).toBe(0);
        } else {
            expect(res.sendStatus).toHaveBeenCalledWith(403);
            expect(mans.length).toBe(1);
        }
    });
});
