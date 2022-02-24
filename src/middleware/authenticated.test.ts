import { getMockRes } from "@jest-mock/express";
import { Request } from "express";
import middleware from "./authenticated";

const { res, mockClear, next } = getMockRes();

beforeEach(mockClear);

describe("Not logged in", () => {
    const cases = [
        { user_id: undefined, business_ids: [1], current_business_id: 1 },
        { user_id: "yolo", business_ids: [1], current_business_id: 1 },
        { user_id: 1, business_ids: undefined, current_business_id: 1 },
        { user_id: 1, business_ids: [], current_business_id: 1 },
        { user_id: 1, business_ids: ["yolo"], current_business_id: 1 },
        { user_id: 1, business_ids: [1], current_business_id: undefined },
        { user_id: 1, business_ids: [1], current_business_id: "yolo" },
    ];

    test.each(cases)("Not logged in can't access", async (session) => {
        middleware({ session, body: {} } as unknown as Request, res, next);
        expect(res.sendStatus).toHaveBeenCalledWith(401);
    });
});

test("valid", () => {
    middleware(
        {
            session: { user_id: 1, business_ids: [1], current_business_id: 1 },
        } as unknown as Request,
        res,
        next
    );
    expect(next).toHaveBeenCalled();
});
