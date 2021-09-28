import ModelTestFail from "../../test/helpers/model/test/fail";
import ModelTestPass from "../../test/helpers/model/test/pass";
import {
    createModels,
    loadAttributes,
} from "../../test/helpers/model/test/setup";
import { teardown } from "../../test/helpers/model/test/teardown";
import BaseWorld from "../../test/jest/support/base_world";
import DBConnection from "../../test/util/db_connection";
import Membership, { MembershipAttributes } from "./membership";

let baseWorld: BaseWorld | undefined;

beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, Membership);
    await createModels(baseWorld, Membership);
});

afterEach(async () => {
    if (!baseWorld) throw new Error(BaseWorld.errorMessage);

    await teardown(baseWorld, Membership);
    baseWorld = undefined;
});

test("Create membership", async () => {
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
