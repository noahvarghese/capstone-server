import { getMockRes } from "@jest-mock/express";
import User from "@models/user/user";
import DBConnection from "@test/support/db_connection";
import { Request } from "express";
import { updateUserController } from "./put_controller";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);
beforeEach(DBConnection.init);
afterEach(async () => {
    await (await DBConnection.get()).manager.delete(User, () => "");
    await DBConnection.close();
});

test("invalid phone", async () => {
    const updateUser = new User({ first_name: "YOLO", phone: "YOLO" });
    const newUser = new User({
        first_name: "test",
        last_name: "test",
        email: "test@test.com",
        phone: "9053393294",
    });

    const connection = await DBConnection.get();
    const {
        identifiers: [{ id: user_id }],
    } = await connection.manager.insert(User, newUser);

    await updateUserController(
        {
            body: updateUser,
            session: { user_id },
            dbConnection: connection,
        } as Request,
        res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
        `phone format invalid -> ${updateUser.phone}`
    );

    const user = await connection.manager.findOneOrFail(User, user_id);

    expect(user.first_name).toBe(newUser.first_name);
    expect(user.phone).toBe(newUser.phone);
    expect(user.email).toBe(newUser.email);
    expect(user.last_name).toBe(newUser.last_name);
});

test("invalid email", async () => {
    const updateUser = new User({ email: "YOLO", phone: "4168384352" });
    const newUser = new User({
        first_name: "test",
        last_name: "test",
        email: "test@test.com",
        phone: "9053393294",
    });

    const connection = await DBConnection.get();
    const {
        identifiers: [{ id: user_id }],
    } = await connection.manager.insert(User, newUser);

    await updateUserController(
        {
            body: updateUser,
            session: { user_id },
            dbConnection: connection,
        } as Request,
        res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
        `email format invalid -> ${updateUser.email}`
    );

    const user = await connection.manager.findOneOrFail(User, user_id);

    expect(user.first_name).toBe(newUser.first_name);
    expect(user.phone).toBe(newUser.phone);
    expect(user.email).toBe(newUser.email);
    expect(user.last_name).toBe(newUser.last_name);
});

test("undefined values do not remove values", async () => {
    const updateUser = new User({ first_name: "YOLO", phone: "4168384352" });
    const newUser = new User({
        first_name: "test",
        last_name: "test",
        email: "test@test.com",
        phone: "9053393294",
    });

    const connection = await DBConnection.get();
    const {
        identifiers: [{ id: user_id }],
    } = await connection.manager.insert(User, newUser);

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
