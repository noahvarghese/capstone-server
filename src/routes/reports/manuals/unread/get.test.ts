import { getMockRes } from "@jest-mock/express";
import Department from "@models/department";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Role, { AccessKey } from "@models/role";
import User from "@models/user/user";
import DBConnection from "@test/support/db_connection";
import getController from "./get";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import { Request } from "express";
import ManualSection from "@models/manual/section";
import Content from "@models/manual/content/content";
import ContentRead from "@models/manual/content/read";
import UserRole from "@models/user/user_role";
import Membership from "@models/membership";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    department_id: number,
    content_id: number;
let secondaryUser: number, secondaryRole: number;
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

    role_id = (await conn.manager.findOneOrFail(Role)).id;
    department_id = (await conn.manager.findOneOrFail(Department)).id;

    ({
        identifiers: [{ id: manual_id }],
    } = await conn.manager.insert(
        Manual,
        new Manual({
            title: "TITLE",
            business_id,
            prevent_delete: false,
            prevent_edit: false,
            published: true,
            updated_by_user_id: user_id,
        })
    ));

    ({
        identifiers: [{ id: secondaryUser }],
    } = await conn.manager.insert(
        User,
        new User({
            first_name: "TEST",
            last_name: "TEST",
            email: process.env.TEST_EMAIL_2,
            password: "TEST",
        })
    ));

    await conn.manager.insert(
        Membership,
        new Membership({
            user_id: secondaryUser,
            business_id,
            updated_by_user_id: user_id,
            accepted: true,
            default_option: true,
            prevent_delete: false,
        })
    );

    ({
        identifiers: [{ id: secondaryRole }],
    } = await conn.manager.insert(
        Role,
        new Role({
            access: "USER",
            department_id,
            name: "TEST",
            prevent_delete: false,
            prevent_edit: false,
            updated_by_user_id: user_id,
        })
    ));

    await conn.manager.insert(
        UserRole,
        new UserRole({
            user_id: secondaryUser,
            role_id: secondaryRole,
            updated_by_user_id: user_id,
        })
    );

    await conn.manager.insert(
        ManualAssignment,
        new ManualAssignment({
            manual_id,
            role_id: secondaryRole,
            updated_by_user_id: user_id,
        })
    );

    const {
        identifiers: [{ id: manual_section_id }],
    } = await conn.manager.insert(
        ManualSection,
        new ManualSection({
            title: "TEST",
            manual_id,
            updated_by_user_id: user_id,
        })
    );

    ({
        identifiers: [{ id: content_id }],
    } = await conn.manager.insert(
        Content,
        new Content({
            title: "TEST",
            manual_section_id,
            updated_by_user_id: user_id,
        })
    ));
});

afterAll(async () => {
    await unitTeardown(conn);
    await conn.close();
});

describe("unread", () => {
    test("returns a user with a manual", async () => {
        await getController(
            {
                session,
                dbConnection: conn,
            } as Request,
            res
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    id: secondaryUser,
                    manuals: expect.arrayContaining([
                        expect.objectContaining({ id: manual_id }),
                    ]),
                }),
            ])
        );
    });
});

describe("read", () => {
    beforeAll(async () => {
        await conn.manager.insert(
            ContentRead,
            new ContentRead({ content_id, user_id: secondaryUser })
        );
    });
    afterAll(async () => {
        await conn.manager.delete(ContentRead, {
            content_id,
            user_id: secondaryUser,
        });
    });
    test("returns empty array", async () => {
        await getController(
            {
                session,
                dbConnection: conn,
            } as Request,
            res
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith([]);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({ length: 0 })
        );
    });
});

describe("permissions", () => {
    const p: AccessKey[] = ["ADMIN", "MANAGER", "USER"];

    describe.each(p)("%p", (access) => {
        beforeAll(async () => {
            await conn.manager.update(Role, role_id, {
                access,
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
            await getController(
                {
                    session,
                    dbConnection: conn,
                } as Request,
                res
            );

            if (access === "USER") {
                expect(res.sendStatus).toHaveBeenCalledWith(403);
            } else {
                expect(res.status).toHaveBeenCalledWith(200);
            }
        });
    });
});

describe("returns distinct users", () => {
    let secondManual: number;

    beforeAll(async () => {
        ({
            identifiers: [{ id: secondManual }],
        } = await conn.manager.insert(
            Manual,
            new Manual({
                title: "TITLE2",
                business_id,
                updated_by_user_id: user_id,
                published: true,
            })
        ));

        await conn.manager.insert(
            ManualAssignment,
            new ManualAssignment({
                manual_id: secondManual,
                role_id: secondaryRole,
                updated_by_user_id: user_id,
            })
        );
    });

    afterAll(async () => {
        await conn.manager.delete(Manual, secondManual);
    });

    test("returns array of 1 item", async () => {
        await getController(
            {
                session,
                dbConnection: conn,
            } as Request,
            res
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    id: secondaryUser,
                    manuals: expect.arrayContaining([
                        expect.objectContaining({ id: manual_id }),
                        expect.objectContaining({ id: secondManual }),
                    ]),
                }),
            ])
        );
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                length: 1,
            })
        );
    });
});

describe("manual (not) published", () => {
    beforeAll(async () => {
        await conn.manager.update(Manual, manual_id, { published: false });
    });

    afterAll(async () => {
        await conn.manager.update(Manual, manual_id, { published: true });
    });

    test("returns empty array", async () => {
        await getController(
            {
                session,
                dbConnection: conn,
            } as Request,
            res
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith([]);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({ length: 0 })
        );
    });
});
