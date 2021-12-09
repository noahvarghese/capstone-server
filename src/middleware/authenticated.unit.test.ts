import { getMockReq, getMockRes } from "@jest-mock/express";
import { NextFunction, Response } from "express";
import { authenticated } from "./authenticated";
import Routes from "./routes.json";

let res: Response, next: NextFunction, clearMockRes: () => void;
const unAuthenticatedRoute = Routes.find((r) => !r.requireAuth);
const authenticatedRoute = Routes.find((r) => r.requireAuth);

beforeEach(async () => {
    const mockRes = getMockRes();
    res = mockRes.res;
    clearMockRes = mockRes.clearMockRes;
    next = mockRes.next;
});

afterEach(async () => {
    clearMockRes();
});

describe("Authenticated user", () => {
    test("Logged in user visiting page requiring authentication", async () => {
        const req = getMockReq({
            routeSettings: authenticatedRoute,
            path: authenticatedRoute?.testURL ?? authenticatedRoute?.url,
            session: {
                user_id: 1,
                business_ids: [1],
                current_business_id: 1,
            },
        });
        await authenticated(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test("Logged in user visiting public page", async () => {
        const req = getMockReq({
            routeSettings: unAuthenticatedRoute,
            path: unAuthenticatedRoute?.testURL ?? unAuthenticatedRoute?.url,
            session: {
                user_id: 1,
                business_ids: [1],
                current_business_id: 1,
                destroy: jest.fn(
                    (callback: (err?: Error) => void) =>
                        new Promise((res) => {
                            setTimeout(() => res(callback()), 10);
                        })
                ),
            },
        });
        await authenticated(req, res, next);
        expect(req.session.destroy).toHaveBeenCalled();
        expect(res.clearCookie).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalled();
    });
});

const cases = [
    { user_id: 1, business_ids: [1], current_business_id: NaN },
    { user_id: 1, business_ids: [NaN], current_business_id: 1 },
    { user_id: 1, business_ids: [], current_business_id: 1 },
    { user_id: 1, business_ids: undefined, current_business_id: 1 },
    { user_id: NaN, business_ids: [1], current_business_id: 1 },
];
test.each(cases)(
    "Unauthenticated user trying to access route requiring authentication",
    async ({ user_id, business_ids, current_business_id }) => {
        const req = getMockReq({
            routeSettings: authenticatedRoute,
            path: authenticatedRoute?.testURL ?? authenticatedRoute?.url,
            session: {
                user_id,
                business_ids,
                current_business_id,
            },
        });
        await authenticated(req, res, next);
        expect(res.sendStatus).toHaveBeenCalledWith(400);
    }
);
