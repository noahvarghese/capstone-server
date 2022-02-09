import { Request } from "express";
import { getMockRes } from "@jest-mock/express";
import { logoutController } from "./post";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

// This means nothing without the tests for a non authenticated user being blocked from calling this
// See the integration tests later on
test("success", async () => {
    await logoutController(
        {
            session: {
                user_id: 1,
                business_ids: [1],
                current_business_id: 1,
                destroy: (callback: (err?: Error) => void) => {
                    callback();
                },
            },
        } as unknown as Request,
        res
    );

    expect(res.clearCookie).toHaveBeenCalledWith(process.env.SESSION_ID);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
});
