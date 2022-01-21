import { uid } from "rand-token";
import ModelActions from "@test/model/helpers/actions";
import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import MembershipInvitation, {
    MembershipInvitationAttributes,
} from "./membership_invitation";
import Model from "@test/model/helpers";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(async () => {
    await DBConnection.close();
});

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, MembershipInvitation);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, MembershipInvitation);
    baseWorld.resetProps();
});

test("Create Membership request creates token and expiry", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    const model = await ModelActions.create<
        MembershipInvitation,
        MembershipInvitationAttributes
    >(baseWorld, MembershipInvitation);

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

    await ModelActions.delete<MembershipInvitation>(
        baseWorld,
        MembershipInvitation
    );
});

test("Update membership request token updates expiry", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    let model = await ModelActions.create<
        MembershipInvitation,
        MembershipInvitationAttributes
    >(baseWorld, MembershipInvitation);

    // set expiry to now
    model = await ModelActions.update<
        MembershipInvitation,
        MembershipInvitationAttributes
    >(baseWorld, MembershipInvitation, { token_expiry: new Date() });

    model = await ModelActions.update<
        MembershipInvitation,
        MembershipInvitationAttributes
    >(baseWorld, MembershipInvitation, { token: uid(32) });

    const allowedError = 5000;
    // 1 day
    const offset = 24 * 60 * 60 * 1000;

    const tokenExpiry = model.token_expiry?.getTime() ?? 0;
    const currentTime = new Date().getTime();
    const expectedExpiry = currentTime + offset;

    const difference = Math.abs(tokenExpiry - expectedExpiry);

    expect(difference).toBeLessThanOrEqual(allowedError);
    expect(difference).toBeGreaterThan(0);

    await ModelActions.delete<MembershipInvitation>(
        baseWorld,
        MembershipInvitation
    );
});
