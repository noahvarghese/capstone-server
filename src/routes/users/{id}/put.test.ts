import { getMockRes } from "@jest-mock/express";
import User from "@models/user/user";
import DBConnection from "@test/support/db_connection";
import { Request } from "express";
import { Connection } from "typeorm";
import { updateUserController } from "./put";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

const newUser = new User({
    first_name: "test",
    last_name: "test",
    email: "test@test.com",
    phone: "9053393294",
});

let user_id: number, connection: Connection;

beforeAll(async () => {
    await DBConnection.init();
    connection = await DBConnection.get();
    ({
        identifiers: [{ id: user_id }],
    } = await connection.manager.insert(User, newUser));
});
afterAll(async () => {
    await (await DBConnection.get()).manager.delete(User, () => "");
    await DBConnection.close();
});

test("invalid phone", async () => {
    const updateUser = new User({ first_name: "YOLO", phone: "YOLO" });

    await updateUserController(
        {
            body: updateUser,
            session: { user_id: NaN },
            dbConnection: connection,
        } as Request,
        res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
        `phone format invalid -> ${updateUser.phone}`
    );
});

test("invalid email", async () => {
    const updateUser = new User({ email: "YOLO", phone: "4168384352" });

    await updateUserController(
        {
            body: updateUser,
            session: { user_id: NaN },
            dbConnection: connection,
        } as Request,
        res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
        `email format invalid -> ${updateUser.email}`
    );
});

test("invalid db connection", async () => {
    await updateUserController(
        {
            session: { user_id: NaN },
        } as Request,
        res
    );

    expect(res.sendStatus).toHaveBeenCalledWith(500);
});

test("undefined values do not remove values", async () => {
    const updateUser = new User({
        first_name: "YOLO",
        phone: "4168384352",
    });
    await updateUserController(
        {
            body: updateUser,
            session: { user_id },
            dbConnection: connection,
        } as Request,
        res
    );

    expect(res.sendStatus).toHaveBeenCalledWith(200);

    const user = await connection.manager.findOneOrFail(User, user_id);
    expect(user.first_name).toBe(updateUser.first_name);
    expect(user.phone).toBe(updateUser.phone);
    expect(user.email).toBe(newUser.email);
    expect(user.last_name).toBe(newUser.last_name);
});
