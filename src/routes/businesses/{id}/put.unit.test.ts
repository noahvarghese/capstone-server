import { getMockRes } from "@jest-mock/express";
import Business from "@models/business";
import Membership from "@models/membership";
import User from "@models/user/user";
import Logs from "@noahvarghese/logger";
import DBConnection from "@test/support/db_connection";
import DataServiceError from "@util/errors/service";
import { Request } from "express";
import { setDefaultBusinessController } from "./put_controller";
import { setDefaultBusinessHandler } from "./put_handler";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

test("user is not a member", async () => {
    await setDefaultBusinessController(
        {
            session: { user_id: 1, business_ids: [1], current_business_id: 1 },
            params: { id: 2 },
        } as unknown as Request,
        res
    );

    expect(res.sendStatus).toHaveBeenCalledWith(403);
});

describe("user is a member", () => {
    let user_id!: number, business_id!: number;

    beforeAll(async () => {
        await DBConnection.init();
        const conn = await DBConnection.get();

        [
            {
                identifiers: [{ id: business_id }],
            },
            {
                identifiers: [{ id: user_id }],
            },
        ] = await Promise.all([
            conn.manager.insert(
                Business,
                new Business({
                    name: "TEST",
                    address: "TEST",
                    city: "TEST",
                    postal_code: "a5s3v2",
                    province: "ON",
                })
            ),
            conn.manager.insert(
                User,
                new User({
                    first_name: "TEST",
                    last_name: "TEST",
                    email: "test@test.com",
                })
            ),
        ]);
        await conn.manager.insert(
            Membership,
            new Membership({
                user_id,
                business_id,
                updated_by_user_id: user_id,
                default_option: false,
            })
        );
    });

    afterAll(async () => {
        const conn = await DBConnection.get();

        await conn.manager.clear(Membership);
        await Promise.all([
            conn.manager.delete(User, () => ""),
            conn.manager.delete(Business, () => ""),
        ]);

        await DBConnection.close();
    });
    test("user has no 'default memberships' set", async () => {
        let errorThrown = false;

        try {
            await setDefaultBusinessHandler(
                await DBConnection.get(),
                user_id,
                business_id
            );
        } catch (_e) {
            errorThrown = true;
            const { code } = _e as DataServiceError;
            expect(code).toBe(500);
        }

        expect(errorThrown).toBe(true);
    });

    test("user has a default membership set", async () => {
        const conn = await DBConnection.get();
        await conn.manager.update(
            Membership,
            { user_id, business_id },
            {
                default_option: true,
            }
        );
        let errorThrown = false;

        try {
            await setDefaultBusinessHandler(
                await DBConnection.get(),
                user_id,
                business_id
            );
        } catch (_e) {
            Logs.Test(_e);
            errorThrown = true;
        }

        expect(errorThrown).toBe(false);
    });
});
