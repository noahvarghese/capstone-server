import { getMockRes } from "@jest-mock/express";
import { Request } from "express";
import middleware from "./middleware";

const { res, mockClear, next } = getMockRes();

beforeEach(mockClear);

test("invalid id", () => {
    middleware({ params: { id: "asdf" } } as unknown as Request, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(400);
});

test("valid id", () => {
    middleware({ params: { id: "1" } } as unknown as Request, res, next);
    expect(next).toHaveBeenCalled();
});
