import { getMockRes } from "@jest-mock/express";
import DBConnection from "@test/support/db_connection";
import { Request } from "express";
import { Connection } from "typeorm";
import getController from "./get";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let conn: Connection;

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();
});

test("", async () => {
    await getController(
        { dbConnection: conn, params: { id: 1 } } as unknown as Request,
        res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
            question_type: "multiple choice",
            html_tag: "input",
        })
    );
});
