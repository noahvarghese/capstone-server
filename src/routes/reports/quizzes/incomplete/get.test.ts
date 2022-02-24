import { getMockRes } from "@jest-mock/express";
import Department from "@models/department";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Membership from "@models/membership";
import Role, { AccessKey } from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import { Request } from "express";
import getController from "./get";
import QuizAttempt from "@models/quiz/attempt";
import Quiz from "@models/quiz/quiz";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    department_id: number,
    quiz_id: number;
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

    ({
        identifiers: [{ id: quiz_id }],
    } = await conn.manager.insert(
        Quiz,
        new Quiz({
            title: "QUIZ",
            manual_id,
            max_attempts: 1,
            prevent_delete: false,
            prevent_edit: false,
            published: true,
            updated_by_user_id: user_id,
        })
    ));
});

afterAll(async () => {
    await unitTeardown(conn);
    await conn.close();
});

test.todo("quiz (not) published");

describe("incomplete", () => {
    test("returns a user with a quiz", async () => {
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
                    quizzes: expect.arrayContaining([
                        expect.objectContaining({ id: quiz_id }),
                    ]),
                }),
            ])
        );
    });
});

describe.skip("started but incomplete", () => {
    beforeAll(async () => {
        await conn.manager.insert(
            QuizAttempt,
            new QuizAttempt({ quiz_id, user_id: secondaryUser })
        );
    });
    afterAll(async () => {
        await conn.manager.delete(QuizAttempt, {
            quiz_id,
            user_id: secondaryUser,
        });
    });
    test("returns a user with a quiz", async () => {
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
                    quizzes: expect.arrayContaining([
                        expect.objectContaining({ id: quiz_id }),
                    ]),
                }),
            ])
        );
    });
});

describe("complete", () => {
    beforeAll(async () => {
        await conn.manager.insert(
            QuizAttempt,
            new QuizAttempt({ quiz_id, user_id: secondaryUser })
        );
        await conn.manager.update(
            QuizAttempt,
            {
                quiz_id,
                user_id: secondaryUser,
            },
            { updated_on: new Date() }
        );
    });
    afterAll(async () => {
        await conn.manager.delete(QuizAttempt, {
            quiz_id,
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
    let secondQuiz: number;
    beforeAll(async () => {
        ({
            identifiers: [{ id: secondQuiz }],
        } = await conn.manager.insert(
            Quiz,
            new Quiz({
                title: "TITLE2",
                manual_id,
                max_attempts: 1,
                updated_by_user_id: user_id,
            })
        ));
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
                    quizzes: expect.arrayContaining([
                        expect.objectContaining({ id: quiz_id }),
                        expect.objectContaining({ id: secondQuiz }),
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
