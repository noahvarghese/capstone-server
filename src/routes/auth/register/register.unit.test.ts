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
import DBConnection from "@test/support/db_connection";

const data = {
    name: "TEST",
    address: "TEST",
    city: "TEST",
    province: "TE",
    postal_code: "L5V2A4",
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

describe("missing parameters", () => {
    const cases = [
        { key: "name", value: "" },
        { key: "email", value: "test" },
        { key: "phone", value: "test" },
        { key: "postal_code", value: "test" },
        { key: "province", value: "test" },
    ];

    test.each(cases)("%p", async ({ key, value }) => {
        const prevValue = data[key as keyof typeof data];
        data[key as keyof typeof data] = value;

        await registerController({ body: data } as Request, res);

        data[key as keyof typeof data] = prevValue;

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
            value
                ? `${key} format invalid -> ${value}`
                : `${key} does not exist in data`
        );
    });
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

            data.phone = prevValue as typeof data.phone;

            expect(res.status).toHaveBeenCalledWith(201);
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
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe("tests fail, requires existing model", () => {
        beforeAll(async () => {
            await registerController(
                {
                    dbConnection: await DBConnection.get(),
                    session: {},
                    body: data,
                } as Request,
                res
            );
        });

        afterAll(cleanup);

        test("Business with name already exists", async () => {
            prevValue = data.email;
            data.email = "yolo@test123.com";

            await registerController(
                {
                    dbConnection: await DBConnection.get(),
                    body: data,
                } as Request,
                res
            );

            data.email = prevValue as string;
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith("Business name is in use");
        });

        test("User with email already exists", async () => {
            prevValue = data.name;
            data.name = "Res taur Ant";

            await registerController(
                {
                    dbConnection: await DBConnection.get(),
                    body: data,
                } as Request,
                res
            );

            data.name = prevValue as string;
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith("Email is in use");
        });
    });
});
