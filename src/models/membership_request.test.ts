import { uid } from "rand-token";
import ModelActions from "@test/helpers/model/actions";
import ModelTestPass from "@test/helpers/model/test/pass";
import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import MembershipRequest, {
    MembershipRequestAttributes,
} from "./membership_request";
import Model from "@test/helpers/model";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, MembershipRequest);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, MembershipRequest);
    baseWorld.resetProps();
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
