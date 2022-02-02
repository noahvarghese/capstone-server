import { getMockRes } from "@jest-mock/express";
import { Request } from "express";
import middleware from "./middleware";

const { res, mockClear, next } = getMockRes();

beforeEach(mockClear);

test("invalid user_id", () => {
    middleware(
        {
            session: {
                user_id: "asdf",
                business_ids: [1],
                current_business_id: 1,
            },
        } as unknown as Request,
        res,
        next
    );
    expect(res.sendStatus).toHaveBeenCalledWith(401);
});

test("invalid current_business_id", () => {
    middleware(
        {
            session: {
                user_id: 1,
                business_ids: [1],
                current_business_id: "asdf",
            },
        } as unknown as Request,
        res,
        next
    );
    expect(res.sendStatus).toHaveBeenCalledWith(401);
});

describe("invalid business_ids", () => {
    test("undefined business_ids", () => {
        middleware(
            {
                session: {
                    user_id: 1,
                    business_ids: undefined,
                    current_business_id: 1,
                },
            } as unknown as Request,
            res,
            next
        );
        expect(res.sendStatus).toHaveBeenCalledWith(401);
    });

    test("non array business_ids", () => {
        middleware(
            {
                session: {
                    user_id: 1,
                    business_ids: "yolo",
                    current_business_id: 1,
                },
            } as unknown as Request,
            res,
            next
        );
        expect(res.sendStatus).toHaveBeenCalledWith(401);
    });

    test("array of non numbers", () => {
        middleware(
            {
                session: {
                    user_id: 1,
                    business_ids: ["u", "r", "a", "q", "t"],
                    current_business_id: 1,
                },
            } as unknown as Request,
            res,
            next
        );
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
