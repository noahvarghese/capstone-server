import { getMockRes } from "@jest-mock/express";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Policy from "@models/manual/policy";
import ManualSection from "@models/manual/section";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import putController from "./put";

let business_id: number,
    user_id: number,
    manual_id: number,
    section_id: number,
    role_id: number,
    policy_id: number;
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

    ({ id: role_id } = await conn.manager.findOneOrFail(Role));

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
            business_id,
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

    ({
        identifiers: [{ id: section_id }],
    } = await conn.manager.insert(
        ManualSection,
        new ManualSection({
            title: "TEST",
            manual_id,
            updated_by_user_id: user_id,
        })
    ));

    ({
        identifiers: [{ id: policy_id }],
    } = await conn.manager.insert(
        Policy,
        new Policy({
            title: OLD_NAME,
            manual_section_id: section_id,
            updated_by_user_id: user_id,
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
        await conn.manager.update(Manual, manual_id, {
            prevent_edit: false,
        });
    });

    test("", async () => {
        await putController(
            {
                session,
                dbConnection: conn,
                params: { id: policy_id },
                body: { title: NEW_NAME },
            } as unknown as Request,
            res
        );

        const p = await conn.manager.find(Policy);

        expect(res.sendStatus).toHaveBeenCalledWith(405);
        expect(p[0].title).toBe(OLD_NAME);
    });
});

describe("Permissions", () => {
    const cases: AccessKey[] = ["ADMIN", "MANAGER", "USER"];

    afterEach(async () => {
        await conn.manager.update(Role, role_id, {
            access: "ADMIN",
            prevent_edit: true,
        });
        await conn.manager.update(Policy, policy_id, {
            title: OLD_NAME,
        });
    });

    describe.each(cases)("%p", (access) => {
        beforeEach(async () => {
            await conn.manager.update(Role, role_id, {
                access,
                prevent_edit: false,
            });
        });

        test("", async () => {
            await putController(
                {
                    session,
                    dbConnection: conn,
                    body: { title: NEW_NAME },
                    params: { id: policy_id },
                } as unknown as Request,
                res
            );

            const p = await conn.manager.find(Policy);

            if (access !== "USER") {
                expect(res.sendStatus).toHaveBeenCalledWith(200);
                expect(p[0].title).toBe(NEW_NAME);
            } else {
                expect(res.sendStatus).toHaveBeenCalledWith(403);
                expect(p[0].title).toBe(OLD_NAME);
            }
        });
    });
});
