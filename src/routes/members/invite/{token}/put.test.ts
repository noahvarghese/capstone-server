import { getMockRes } from "@jest-mock/express";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import putController from "./put";
import { Request } from "express";
import { Connection } from "typeorm";
import Membership from "@models/membership";
import { uid } from "rand-token";
import User from "@models/user/user";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

let business_id: number, conn: Connection;

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();
    ({ business_id } = await setupAdmin(conn));
});

afterAll(async () => {
    const conn = await DBConnection.get();
    await unitTeardown(conn);
    await DBConnection.close();
});

test("invalid token", async () => {
    await putController(
        {
            params: { token: "YOLO" },
            body: {},
            dbConnection: conn,
        } as unknown as Request,
        res
    );
    expect(res.sendStatus).toHaveBeenCalledWith(400);
});

test("expired token", async () => {
    const { id: user_id } = await conn.manager.save(
        User,
        new User({
            first_name: "TEST",
            last_name: "TEST",
            email: "TEST",
            password: "TEST",
        })
    );
    await conn.manager.insert(
        Membership,
        new Membership({
            user_id,
            business_id,
            updated_by_user_id: user_id,
            token: uid(32),
        })
    );
    await conn.manager.update(
        Membership,
        { user_id, business_id },
        { token_expiry: new Date(0) }
    );
    const { token } = await conn.manager.findOneOrFail(Membership, {
        where: { user_id, business_id },
    });
    await putController(
        {
            params: { token },
            body: {},
            dbConnection: conn,
        } as unknown as Request,
        res
    );
    expect(res.sendStatus).toHaveBeenCalledWith(400);
});
test.todo("valid token, new user");
test.todo("valid token, existing user");
