import { Request } from "express";
import { getMockRes } from "@jest-mock/express";
import { logoutController } from "./controller";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

test("not logged in", async () => {
    await logoutController({ session: {} } as unknown as Request, res);
    expect(res.sendStatus).toHaveBeenCalledWith(401);
});

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
