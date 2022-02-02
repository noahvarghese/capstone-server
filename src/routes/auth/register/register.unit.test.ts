import { Request } from "express";
import { getMockRes } from "@jest-mock/express";
import { registerController } from "./controller";
import UserRole from "@models/user/user_role";
import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import { registerHandler } from "./handler";
import DBConnection from "@test/support/db_connection";

const data = {
    name: "TEST",
    address: "TEST",
    city: "TEST",
    province: "TE",
    postal_code: "TEST",
    first_name: "TEST",
    last_name: "TEST",
    email: "test@test.com",
    phone: "9053393294",
    password: "TEST",
    confirm_password: "TEST",
};

let prevValue: unknown;
const { res, mockClear } = getMockRes();

beforeEach(() => {
    mockClear();
});

test("Missing parameters", async () => {
    prevValue = data.name;
    data.name = "";

    await registerController({ body: data } as unknown as Request, res);

    data.name = prevValue as typeof data.name;

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Invalid field name");
});

test("Invalid email", async () => {
    prevValue = data.email;
    data.email = "TEST";

    await registerController({ body: data } as unknown as Request, res);

    data.email = prevValue as typeof data.email;

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Invalid field email");
});

test("Invalid phone", async () => {
    prevValue = data.phone;
    data.phone = "A";

    await registerController({ body: data } as unknown as Request, res);

    data.phone = prevValue as typeof data.phone;

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Invalid field phone");
});

test("Province should prevent adding entries where the length is greater than the shortform", async () => {
    prevValue = data.province;
    data.province = "ABC";

    await registerController({ body: data } as unknown as Request, res);

    data.province = prevValue as typeof data.province;

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Invalid field province");
});

test("passwords don't match", async () => {
    prevValue = data.password;
    data.password = "ABC";
    data.confirm_password = "DEF";

    await registerController({ body: data } as unknown as Request, res);

    data.password = prevValue as typeof data.password;
    data.confirm_password = prevValue as typeof data.password;

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
        "Invalid field confirm password doesn't match password"
    );
});

describe("requires database", () => {
    beforeAll(DBConnection.init);
    afterAll(DBConnection.close);

    const cleanup = async () => {
        // delete EVERYTHING from database
        const conn = await DBConnection.get();

        await Promise.all([
            conn.manager.delete(UserRole, () => ""),
            conn.manager.update(Role, () => "", {
                prevent_delete: false,
                prevent_edit: false,
            }),
            conn.manager.update(Membership, () => "", {
                prevent_delete: false,
            }),
            conn.manager.update(Department, () => "", {
                prevent_edit: false,
                prevent_delete: false,
            }),
        ]);

        await conn.manager.delete(Role, () => "");

        await Promise.all([
            conn.manager.delete(Membership, () => ""),
            conn.manager.delete(Permission, () => ""),
            conn.manager.delete(Department, () => ""),
        ]);

        await Promise.all([
            conn.manager.delete(User, () => ""),
            conn.manager.delete(Business, () => ""),
        ]);
    };

    describe("tests success, requires cleanup after each", () => {
        afterEach(cleanup);

        test("Valid parameters, no phone", async () => {
            prevValue = data.phone;
            data.phone = "";

            await registerController(
                {
                    body: data,
                    session: {},
                    dbConnection: await DBConnection.get(),
                } as unknown as Request,
                res
            );

            expect(res.sendStatus).toHaveBeenCalledWith(201);

            data.phone = prevValue as typeof data.phone;
        });

        test("Valid parameters, with phone", async () => {
            await registerController(
                {
                    body: data,
                    session: {},
                    dbConnection: await DBConnection.get(),
                } as unknown as Request,
                res
            );
            expect(res.sendStatus).toHaveBeenCalledWith(201);
        });
    });

    describe("tests fail, requires existing model", () => {
        beforeAll(async () => {
            await registerHandler(await DBConnection.get(), data);
        });

        afterAll(cleanup);

        test("Business with name already exists (HANDLER)", async () => {
            prevValue = data.email;
            data.email = "yolo@test123.com";

            let errorThrown = false;
            try {
                await registerHandler(await DBConnection.get(), data);
            } catch (_e) {
                const { message } = _e as Error;
                errorThrown = true;
                expect(message).toBe("Business name is in use");
            }

            data.email = prevValue as typeof data.email;

            expect(errorThrown).toBe(true);
        });

        test("User with email already exists (HANDLER)", async () => {
            prevValue = data.name;
            data.name = "Res taur Ant";

            let errorThrown = false;
            try {
                await registerHandler(await DBConnection.get(), data);
            } catch (_e) {
                const { message } = _e as Error;
                errorThrown = true;
                expect(message).toBe("Email is in use");
            }

            data.name = prevValue as typeof data.name;

            expect(errorThrown).toBe(true);
        });
    });
});
