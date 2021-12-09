import { getMockReq, getMockRes } from "@jest-mock/express";
import DBConnection from "@test/support/db_connection";
import { Response } from "express";
import { forgotPasswordRoute } from "./forgot_password";

let res: Response, clearMockRes: () => void;

beforeAll(async () => {
    await DBConnection.init();
});

afterAll(async () => {
    await DBConnection.close();
});

beforeEach(async () => {
    const mockRes = getMockRes();
    res = mockRes.res;
    clearMockRes = mockRes.clearMockRes;
});

afterEach(async () => {
    clearMockRes();
});

test("Forgot Password Token Created", async () => {
    const req = getMockReq({
        SqlConnection: await DBConnection.get(),
        body: { email: "invalid@email.com" },
    });
    await forgotPasswordRoute(req, res);
});
