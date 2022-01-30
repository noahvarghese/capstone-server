import ModelTestFail from "@test/model/helpers/test/fail";
import ModelTestPass from "@test/model/helpers/test/pass";
import Model from "@test/model/helpers";
import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Membership, { MembershipAttributes } from "./membership";

let baseWorld: BaseWorld | undefined;

beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, Membership);
});

afterEach(async () => {
    if (!baseWorld) throw new Error(BaseWorld.errorMessage);
    await Model.teardown.call(baseWorld, Membership);
    baseWorld.resetProps();
});

test("Create membership success", async () => {
    await ModelTestPass.create<Membership, MembershipAttributes>(
        baseWorld,
        Membership
    );
});

test("Create membership requires business_id", async () => {
    if (!baseWorld) throw new Error(BaseWorld.errorMessage);

    baseWorld.setCustomProp<MembershipAttributes>("membershipAttributes", {
        ...baseWorld.getCustomProp<MembershipAttributes>(
            "membershipAttributes"
        ),
        business_id: null,
    });

    await ModelTestFail.create<Membership, MembershipAttributes>(
        baseWorld,
        Membership,
        /MembershipInsertError: Business id cannot be null or empty/
    );
});

test("Update membership should fail when business is null or empty", async () => {
    await ModelTestFail.update<Membership, MembershipAttributes>(
        baseWorld,
        Membership,
        { business_id: null },
        /MembershipUpdateError: Business id cannot be null or empty/
    );
});

test("Update membership should fail when user is null or empty", async () => {
    await ModelTestFail.update<Membership, MembershipAttributes>(
        baseWorld,
        Membership,
        { user_id: null },
        /MembershipUpdateError: User id cannot be null or empty/
    );
});

test("read membership", async () => {
    await ModelTestPass.read<Membership, MembershipAttributes>(
        baseWorld,
        Membership,
        ["user_id", "business_id"]
    );
});

// deleting should not be possible because all employees when leaving
// an organization should be deactivated
// but we need delete to be able to clean the test db regularly
test("delete membership", async () => {
    await ModelTestPass.delete<Membership, MembershipAttributes>(
        baseWorld,
        Membership,
        ["user_id", "business_id"]
    );
});
