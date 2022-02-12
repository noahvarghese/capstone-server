import { getMockRes } from "@jest-mock/express";
import User from "@models/user/user";
import DBConnection from "@test/support/db_connection";
import { Request } from "express";
import { getUserController } from "./get";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

describe("db connection required", () => {
    beforeAll(DBConnection.init);
    afterAll(DBConnection.close);

    test("invalid user id", async () => {
        await getUserController(
            {
                session: { user_id: 1 },
                dbConnection: await DBConnection.get(),
            } as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenCalledWith(400);
    });

    describe("Create a user", () => {
        let user: User;

        beforeAll(async () => {
            const conn = await DBConnection.get();
            user = new User({
                first_name: "test",
                last_name: "test",
                email: "test@test.com",
                phone: "9053393294",
            });
            const {
                identifiers: [{ id }],
            } = await conn.manager.insert(User, user);
            user.id = id;
        });
        afterAll(async () => {
            const conn = await DBConnection.get();
            await conn.manager.delete(User, user.id);
        });

        test("success", async () => {
            await getUserController(
                {
                    session: { user_id: user.id },
                    dbConnection: await DBConnection.get(),
                } as Request,
                res
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
            });
        });
    });
});
