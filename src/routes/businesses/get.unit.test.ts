import Business from "@models/business";
import Membership from "@models/membership";
import User from "@models/user/user";
import DBConnection from "@test/support/db_connection";
import { getBusinessHandler } from "./get_handler";

let business_id!: number, user_id!: number;
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
            default_option: true,
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

test("can read all businesses the user is a member of", async () => {
    const res = await getBusinessHandler(await DBConnection.get(), user_id);
    expect(res.length).toBe(1);
    expect(res[0].id).toBe(business_id);
    expect(res[0].default).toBe(true);
});
