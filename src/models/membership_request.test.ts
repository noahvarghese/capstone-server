import { uid } from "rand-token";
import ModelActions from "../../test/jest/helpers/model/actions";
import ModelTestPass from "../../test/jest/helpers/model/test/pass";
import {
    createModels,
    loadAttributes,
} from "../../test/jest/helpers/model/test/setup";
import { teardown } from "../../test/jest/helpers/model/test/teardown";
import BaseWorld from "../../test/jest/support/base_world";
import DBConnection from "../../test/util/db_connection";
import MembershipRequest, {
    MembershipRequestAttributes,
} from "./membership_request";

let baseWorld: BaseWorld | undefined;

beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, MembershipRequest);
    await createModels(baseWorld, MembershipRequest);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    await teardown<MembershipRequest>(baseWorld, MembershipRequest);
    baseWorld = undefined;
});

test("Create Membership request creates token and expiry", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    const model = await ModelActions.create<
        MembershipRequest,
        MembershipRequestAttributes
    >(baseWorld, MembershipRequest);

    expect(model.token.length).toBe(32);

    const allowedError = 5000;
    // 1 day
    const offset = 24 * 60 * 60 * 1000;

    const tokenExpiry = model.token_expiry?.getTime() ?? 0;
    const currentTime = new Date().getTime();
    const expectedExpiry = currentTime + offset;

    const difference = Math.abs(tokenExpiry - expectedExpiry);

    expect(difference).toBeLessThanOrEqual(allowedError);
    expect(difference).toBeGreaterThan(0);

    await ModelActions.delete<MembershipRequest>(baseWorld, MembershipRequest);
});

test("Update membership request token updates expiry", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    let model = await ModelActions.create<
        MembershipRequest,
        MembershipRequestAttributes
    >(baseWorld, MembershipRequest);

    // set expiry to now
    model = await ModelActions.update<
        MembershipRequest,
        MembershipRequestAttributes
    >(baseWorld, MembershipRequest, { token_expiry: new Date() });

    model = await ModelActions.update<
        MembershipRequest,
        MembershipRequestAttributes
    >(baseWorld, MembershipRequest, { token: uid(32) });

    const allowedError = 5000;
    // 1 day
    const offset = 24 * 60 * 60 * 1000;

    const tokenExpiry = model.token_expiry?.getTime() ?? 0;
    const currentTime = new Date().getTime();
    const expectedExpiry = currentTime + offset;

    const difference = Math.abs(tokenExpiry - expectedExpiry);

    expect(difference).toBeLessThanOrEqual(allowedError);
    expect(difference).toBeGreaterThan(0);

    await ModelActions.delete<MembershipRequest>(baseWorld, MembershipRequest);
});

test("read membership request", async () => {
    await ModelTestPass.read(baseWorld, MembershipRequest, [
        "user_id",
        "business_id",
    ]);
});

test("delete membership request", async () => {
    await ModelTestPass.delete(baseWorld, MembershipRequest, [
        "user_id",
        "business_id",
    ]);
});
