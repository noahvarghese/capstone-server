import { getMockRes } from "@jest-mock/express";
import postController from "./post";
import { Request } from "express";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

describe("", () => {
    test("", async () => {
        await postController({} as Request, res);
    });
});
