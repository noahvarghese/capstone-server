import { getMockRes } from "@jest-mock/express";
import { Request } from "express";
import { setCurrentBusinessController } from "./post_controller";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

test("user is a member", async () => {
    await setCurrentBusinessController(
        {
            session: {
                user_id: 1,
                business_ids: [1, 2],
                current_business_id: 1,
            },
            params: { id: 2 },
        } as unknown as Request,
        res
    );

    expect(res.sendStatus).toHaveBeenCalledWith(200);
});

test("user is not a member", async () => {
    await setCurrentBusinessController(
        {
            session: { user_id: 1, business_ids: [1], current_business_id: 1 },
            params: { id: 2 },
        } as unknown as Request,
        res
    );

    expect(res.sendStatus).toHaveBeenCalledWith(403);
});
