import Business from "@models/business";
import Membership from "@models/membership";
import helpers from "@test/helpers";
import Request from "@test/api/helpers/request";
import { getAdminUserId, getBusiness } from "@test/api/helpers/setup-actions";
import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import { login } from "@test/api/actions/auth";
import { getBusinesses } from "@test/api/actions/business";

let baseWorld: BaseWorld;

beforeAll(async () => {
    await DBConnection.init();
    await helpers.AppServer.setup(false);
});

afterAll(async () => {
    await helpers.AppServer.teardown();
    await DBConnection.close();
});

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await helpers.Api.setup(baseWorld, "@setup_invite_member");
});

afterEach(async () => {
    await helpers.Api.teardown(baseWorld, "@cleanup_user_role");
});

describe("User assigned to multiple businesses", () => {
    const newBusinessName = "TEST123";
    let businessId: number;

    beforeEach(async () => {
        const connection = baseWorld.getConnection();
        const adminId = await getAdminUserId.call(baseWorld);
        // create second business in database
        const businessResult = await connection.manager.insert(Business, {
            name: newBusinessName,
        });
        // add user as member via database
        await connection.manager.insert(Membership, {
            business_id: businessResult.identifiers[0].id,
            user_id: adminId,
        });

        businessId = businessResult.identifiers[0].id;
        // Given the user is a member of multiple businesses
        await login.call(login, baseWorld);
    });
    afterEach(async () => {
        const connection = baseWorld.getConnection();
        // cleanup

        await connection.manager.delete(Membership, {
            business_id: businessId,
        });
        await connection.manager.delete(Business, { id: businessId });
    });
    test("reads list of business with one marked as default", async () => {
        // When the user requests the businesses they are apart of
        await getBusinesses.call(getBusinesses, baseWorld);

        // Then the user gets a list back
        Request.succeeded.call(baseWorld, { auth: false });

        const response = baseWorld.getCustomProp<
            {
                id: number;
                default: boolean;
                name: string;
            }[]
        >("responseData");

        const prevBusinessId = await getBusiness.call(baseWorld);
        const prevBusiness = response.find((r) => r.id === prevBusinessId);
        const newBusiness = response.find((r) => r.name === newBusinessName);

        expect(newBusiness).toBeTruthy();
        expect(prevBusiness?.default).toBe(true);
    });
});
