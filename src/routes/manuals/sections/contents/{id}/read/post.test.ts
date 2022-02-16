import { getMockRes } from "@jest-mock/express";
import ManualAssignment from "@models/manual/assignment";
import Content from "@models/manual/content/content";
import Manual from "@models/manual/manual";
import ManualSection from "@models/manual/section";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import postController from "./post";
import { Request } from "express";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    section_id: number,
    content_id: number;

let conn: Connection;

let session: Omit<SessionData, "cookie">;

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();

    ({ business_id, user_id } = await setupAdmin(conn));
    role_id = (await conn.manager.findOneOrFail(Role)).id;

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
            title: "TEST",
            prevent_delete: false,
            prevent_edit: false,
            published: true,
            updated_by_user_id: user_id,
            business_id,
        })
    ));

    await conn.manager.insert(
        ManualAssignment,
        new ManualAssignment({
            manual_id,
            updated_by_user_id: user_id,
            role_id,
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
        identifiers: [{ id: content_id }],
    } = await conn.manager.insert(
        Content,
        new Content({
            title: "TEST",
            manual_section_id: section_id,
            updated_by_user_id: user_id,
        })
    ));
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("published", () => {
    const pub = [true, false];

    describe.each(pub)("published: %p", (published) => {
        beforeAll(async () => {
            conn.manager.update(Manual, manual_id, {
                published,
            });
        });

        describe("only the logged in 'USER' can set their own 'read' status", () => {
            const cases: AccessKey[] = ["ADMIN", "MANAGER", "USER"];

            afterAll(async () => {
                return;
            });

            describe.each(cases)("role: %p", (access) => {
                beforeAll(async () => {
                    await conn.manager.update(Role, role_id, {
                        access: access as AccessKey,
                        prevent_edit: false,
                    });
                });

                afterAll(async () => {
                    await conn.manager.update(Role, role_id, {
                        access: "ADMIN",
                        prevent_edit: true,
                    });
                });

                test("", async () => {
                    await postController(
                        {
                            session,
                            params: { id: content_id },
                            dbConnection: conn,
                        } as unknown as Request,
                        res
                    );

                    if (access === "USER") {
                        if (published === true) {
                            expect(res.sendStatus).toHaveBeenCalledWith(200);
                        } else {
                            expect(res.sendStatus).toHaveBeenCalledWith(400);
                        }
                    } else {
                        expect(res.sendStatus).toHaveBeenCalledWith(403);
                    }
                });
            });
        });
    });
});
