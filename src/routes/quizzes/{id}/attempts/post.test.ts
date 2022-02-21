import { getMockRes } from "@jest-mock/express";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Quiz from "@models/quiz/quiz";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import postController from "./post";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    quiz_id: number;
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

    role_id = (await conn.manager.findOneOrFail(Role)).id;

    await conn.manager.insert(
        ManualAssignment,
        new ManualAssignment({
            manual_id,
            updated_by_user_id: user_id,
            role_id,
        })
    );

    ({
        identifiers: [{ id: quiz_id }],
    } = await conn.manager.insert(
        Quiz,
        new Quiz({
            title: "TEST",
            prevent_delete: false,
            prevent_edit: false,
            published: true,
            max_attempts: 1,
            manual_id,
            updated_by_user_id: user_id,
        })
    ));
});

afterAll(async () => {
    await unitTeardown(conn);
    await conn.close();
});

test.todo("max attempts stops user from going over the max attempts");
test.todo("user can create a quiz attempt for themselves");
test.todo("user cannot attempt quiz that is not assigned");
test.todo("user cannot attempt quiz that is not published");
test.todo("user cannot attempt quiz whose manual is not published");

describe("permissions", () => {
    const p: AccessKey[] = ["ADMIN", "MANAGER"];
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

        test.skip("only users can create an attempt", async () => {
            await postController(
                {
                    dbConnection: conn,
                    session,
                    params: { id: quiz_id },
                } as unknown as Request,
                res
            );
            expect(res.sendStatus).toHaveBeenCalledWith(403);
        });
    });
});
