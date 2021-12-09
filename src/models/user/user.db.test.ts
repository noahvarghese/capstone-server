import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import User, { UserAttributes } from "./user";
import dotenv from "dotenv";
import Model from "@test/model/helpers";
import ModelActions from "@test/model/helpers/actions";

dotenv.config();

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(async () => {
    await DBConnection.close();
});

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, User);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, User);
    baseWorld.resetProps();
});

test("Create Token", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const user = new User();
    const initialVal = user.token;

    user.createToken();

    expect(user.token).not.toBe(initialVal);

    await ModelActions.delete<User>(baseWorld, User);
});

test("Updated user should have 1hr to update password", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    let user = await ModelActions.create<User, UserAttributes>(baseWorld, User);
    user.createToken();
    user = await ModelActions.update<User, UserAttributes>(baseWorld, User, {
        token: user.token,
    });

    // Offset to adjust for delays potentially
    const allowedError = 5000;
    // 1 hr
    const offset = 60 * 60 * 1000;

    const tokenExpiry = user.token_expiry?.getTime() ?? 0;
    const currentTime = new Date().getTime();
    const expectedExpiry = currentTime + offset;

    const difference = Math.abs(tokenExpiry - expectedExpiry);

    expect(difference).toBeLessThanOrEqual(allowedError);
    expect(difference).toBeGreaterThan(0);

    await ModelActions.delete<User>(baseWorld, User);
});

test("Token Should Be Valid", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    let user = await ModelActions.create<User, UserAttributes>(baseWorld, User);

    user.createToken();

    user = await ModelActions.update<User, UserAttributes>(baseWorld, User, {
        token: user.token,
    });
    const match = user.compareToken(user.token ?? "");

    expect(user.token?.length).toBeGreaterThan(0);
    expect(match).toBe(true);

    await ModelActions.delete<User>(baseWorld, User);
});

test("Invalid token expiry", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    let user = await ModelActions.create<User, UserAttributes>(baseWorld, User);

    user.createToken();

    user = await ModelActions.update<User, UserAttributes>(baseWorld, User, {
        token: user.token,
    });

    user.token_expiry = new Date(0);

    const match = user.compareToken(user.token ?? "");

    expect(user.token?.length).toBeGreaterThan(0);
    expect(match).toBe(false);

    await ModelActions.delete<User>(baseWorld, User);
});

test("Wrong token should not match", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const connection = baseWorld.getConnection();
    const attributes =
        baseWorld.getCustomProp<UserAttributes>("userAttributes");
    const attributes2 =
        baseWorld.getCustomProp<UserAttributes>("userAttributes");

    let user1 = new User(attributes);
    let user2 = new User({ ...attributes2, email: "test@test.com" });

    user1.createToken();
    user2.createToken();

    user1 = await connection.manager.save(user1);
    user1 =
        (await connection.manager.find(User, { where: { id: user1.id } }))[0] ??
        user1;

    user2 = await connection.manager.save(user2);
    user2 =
        (await connection.manager.find(User, { where: { id: user2.id } }))[0] ??
        user2;

    const match = user1.compareToken(user2.token ?? "");

    expect(match).toBe(false);

    await connection.manager.remove(user1);
    await connection.manager.remove(user2);

    baseWorld.setCustomProp<undefined>("userAttributes", undefined);
});

test("Reset Password", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const attributes =
        baseWorld.getCustomProp<UserAttributes>("userAttributes");

    const oldPassword = attributes.password;

    let user = await ModelActions.create<User, UserAttributes>(baseWorld, User);
    user.createToken();
    user = await ModelActions.update<User, UserAttributes>(baseWorld, User, {
        token: user.token,
    });

    const result = await user.resetPassword(oldPassword, user.token ?? "");

    expect(result).toBe(true);
    expect(user.token).toBe(null);
    expect(user.token_expiry).toBe(null);
    expect(user.password).not.toBe(oldPassword);
    expect(await user.comparePassword(oldPassword)).toBe(true);

    await ModelActions.delete<User>(baseWorld, User);
});

test("Reset password empty", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const connection = baseWorld.getConnection();
    const attributes =
        baseWorld.getCustomProp<UserAttributes>("userAttributes");

    const oldPassword = attributes.password;

    let user = new User(attributes);
    user.createToken();
    user = await connection.manager.save(user);
    user =
        (await connection.manager.find(User, { where: { id: user.id } }))[0] ??
        user;

    const result = await user.resetPassword("", user.token ?? "");

    expect(result).toBe(false);
    expect(user.token).not.toBe(undefined);
    expect(user.token_expiry).not.toBe(undefined);
    expect(user.password).toBe(oldPassword);
    expect(await user.comparePassword(oldPassword)).toBe(false);

    await connection.manager.remove(user);
});
