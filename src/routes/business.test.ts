import Business from "@models/business";
import Membership from "@models/membership";
import helpers from "@test/helpers";
import Request from "@test/api/helpers/request";
import { getAdminUserId, getBusiness } from "@test/api/helpers/setup-actions";
import actions from "@test/api/actions";
import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";

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
    await helpers.Api.setup.call(baseWorld, "@setup_invite_user");
});

afterEach(async () => {
    await helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
});

test("User with multiple business receives list of business with one marked as default", async () => {
    // Given the user is a member of multiple businesses
    const connection = baseWorld.getConnection();
    const adminId = await getAdminUserId.call(baseWorld);
    const newBusinessName = "TEST123";
    // create second business in database
    const businessResult = await connection.manager.insert(Business, {
        name: newBusinessName,
    });

    // add user as member via database
    const membershipResult = await connection.manager.insert(Membership, {
        business_id: businessResult.identifiers[0].id,
        user_id: adminId,
    });

    await actions.login.call(baseWorld);
    // When the user requests the businesses they are apart of
    await actions.getBusinesses.call(baseWorld);

    // Then the user gets a list back
    Request.succeeded.call(baseWorld, { auth: false });

    const data = baseWorld.getCustomProp<{
        data: {
            id: number;
            default: boolean;
            name: string;
        }[];
    }>("responseData");

    const { data: response } = data;

    const prevBusinessId = await getBusiness.call(baseWorld);
    const prevBusiness = response.find((r) => r.id === prevBusinessId);
    const newBusiness = response.find((r) => r.name === newBusinessName);

    expect(newBusiness).toBeTruthy();
    expect(prevBusiness?.default).toBe(true);

    // cleanup

    await connection.manager.delete(Membership, {
        business_id: membershipResult.identifiers[0].business_id,
    });
    await connection.manager.delete(Business, {
        id: businessResult.identifiers[0].id,
    });
});
