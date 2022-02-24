import { connectionOptions } from "@config/database";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { Request } from "express";
import { Connection, createConnection } from "typeorm";
import dbConnection from "./db_connection";

const { res, mockClear, next } = getMockRes();
const req = getMockReq();

beforeEach(mockClear);

test("missing db connection", async () => {
    dbConnection({} as Request, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(500);
});

describe("success", () => {
    let conn: Connection;
    beforeAll(async () => {
        conn = await createConnection({
            ...connectionOptions(),
            logging: false,
        });
    });
    afterAll(async () => {
        if (conn) conn.close();
    });
    test("success", async () => {
        dbConnection(req, res, next);

        expect(req.dbConnection).not.toBe(undefined);
        expect(req.dbConnection.isConnected).toBe(true);
        expect(next).toHaveBeenCalled();
    });
});
