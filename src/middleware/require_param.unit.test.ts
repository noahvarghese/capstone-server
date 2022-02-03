import { getMockRes } from "@jest-mock/express";
import { Request } from "express";
import requireParam from "./require_param";

const { res, mockClear, next } = getMockRes();

beforeEach(mockClear);

test("invalid id", () => {
    const middleware = requireParam("id", (val: string) => !isNaN(Number(val)));
    middleware({ params: { id: "asdf" } } as unknown as Request, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(400);
});

test("valid id", () => {
    const middleware = requireParam("id", (val: string) => !isNaN(Number(val)));
    middleware({ params: { id: "1" } } as unknown as Request, res, next);
    expect(next).toHaveBeenCalled();
});
