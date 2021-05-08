import BaseWorld from "../../../test/util/store";
import DBConnection from "../../../test/util/db_connection";
import { createModel, deleteModel } from "../../../test/util/model_actions";
import Business, { BusinessAttributes } from "../business";
import {
    businessAttributes,
    userAttributes,
} from "../../../test/util/attributes";
import User, { UserAttributes } from "./user";
import {
    testCreateModel,
    testDeleteModel,
    testReadModel,
    testUpdateModel,
} from "../../../test/util/model_compare";
import dotenv from "dotenv";
dotenv.config();

let baseWorld: BaseWorld | undefined;
const key = "user";

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    baseWorld.setCustomProp<UserAttributes>("userAttributes", userAttributes);
    baseWorld.setCustomProp<BusinessAttributes>(
        "businessAttributes",
        businessAttributes
    );
});
afterEach(() => {
    baseWorld = undefined;
});

// Business Setup
beforeEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const business = await createModel<Business, BusinessAttributes>(
        baseWorld,
        Business,
        "business"
    );

    baseWorld.setCustomProp<UserAttributes>("userAttributes", {
        ...baseWorld.getCustomProp<UserAttributes>("userAttributes"),
        business_id: business.id,
    });
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await deleteModel<Business>(baseWorld, Business, "business");
});

// Tests

test("Create User", async () => {
    await testCreateModel<User, UserAttributes>(baseWorld, User, key);
});

test("Update User", async () => {
    await testUpdateModel<User, UserAttributes>(
        baseWorld,
        User,
        key,
        "first_name",
        "TEST"
    );
});

test("Delete User", async () => {
    await testDeleteModel<User, UserAttributes>(baseWorld, User, key, ["id"]);
});

test("Read User", async () => {
    await testReadModel<User, UserAttributes>(baseWorld, User, key, ["email"]);
});

test("Create Token", async () => {
    const user = new User();
    const initialVal = user.token;

    user.createToken();

    expect(user.token).not.toBe(initialVal);
});

test("Created user should have 1 day to set password", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;
    const attributes = baseWorld.getCustomProp<UserAttributes>(
        `${key}Attributes`
    );

    let user = new User(attributes);
    user.createToken();
    user = await connection.manager.save(user);
    user =
        (await connection.manager.find(User, { where: { id: user.id } }))[0] ??
        user;

    // Offset to adjust for delays potentially
    const allowedError = 5000;
    // 1 day
    const offset = 24 * 60 * 60 * 1000;

    const tokenExpiry = user.token_expiry?.getTime() ?? 0;
    const currentTime = new Date().getTime();
    const expectedExpiry = currentTime + offset;

    const difference = Math.abs(tokenExpiry - expectedExpiry);

    expect(difference).toBeLessThanOrEqual(allowedError);

    await connection.manager.remove(user);
});

test("Updated user should have 1hr to update password", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;
    const attributes = baseWorld.getCustomProp<UserAttributes>(
        `${key}Attributes`
    );

    let user = new User(attributes);
    user.createToken();
    user = await connection.manager.save(user);
    user =
        (await connection.manager.find(User, { where: { id: user.id } }))[0] ??
        user;

    // Trigger Update
    user.createToken();
    user = await connection.manager.save(user);
    user =
        (await connection.manager.find(User, { where: { id: user.id } }))[0] ??
        user;

    // Offset to adjust for delays potentially
    const allowedError = 5000;
    // 1 hr
    const offset = 60 * 60 * 1000;

    const tokenExpiry = user.token_expiry?.getTime() ?? 0;
    const currentTime = new Date().getTime();
    const expectedExpiry = currentTime + offset;

    const difference = Math.abs(tokenExpiry - expectedExpiry);

    expect(difference).toBeLessThanOrEqual(allowedError);

    await connection.manager.remove(user);
});

test("Token Should Be Valid", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;
    const attributes = baseWorld.getCustomProp<UserAttributes>(
        "userAttributes"
    );
    let user = new User(attributes);
    user.createToken();

    user = await connection.manager.save(user);
    user =
        (await connection.manager.find(User, { where: { id: user.id } }))[0] ??
        user;

    const match = user.compareToken(user.token ?? "");

    expect(user.token?.length).toBeGreaterThan(0);
    expect(match).toBe(true);
    await connection.manager.remove(user);
});

test("Invalid token expiry", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;
    const attributes = baseWorld.getCustomProp<UserAttributes>(
        "userAttributes"
    );
    let user = new User(attributes);
    user.createToken();

    user = await connection.manager.save(user);
    user =
        (await connection.manager.find(User, { where: { id: user.id } }))[0] ??
        user;
    user.token_expiry = new Date(0);

    const match = user.compareToken(user.token ?? "");

    expect(user.token?.length).toBeGreaterThan(0);
    expect(match).toBe(false);
    await connection.manager.remove(user);
});

test("Wrong token should not match", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;
    const attributes = baseWorld.getCustomProp<UserAttributes>(
        "userAttributes"
    );
    const attributes2 = baseWorld.getCustomProp<UserAttributes>(
        "userAttributes"
    );

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
});

test("Reset Password", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;
    const attributes = baseWorld.getCustomProp<UserAttributes>(
        `${key}Attributes`
    );

    const oldPassword = attributes.password;

    let user = new User(attributes);
    user.createToken();
    user = await connection.manager.save(user);
    user =
        (await connection.manager.find(User, { where: { id: user.id } }))[0] ??
        user;

    const result = await user.resetPassword(oldPassword, user.token ?? "");

    expect(result).toBe(true);
    expect(user.token).toBe(undefined);
    expect(user.token_expiry).toBe(undefined);
    expect(user.password).not.toBe(oldPassword);
    expect(await user.comparePassword(oldPassword)).toBe(true);

    await connection.manager.remove(user);
});

test("Reset password empty", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;
    const attributes = baseWorld.getCustomProp<UserAttributes>(
        `${key}Attributes`
    );

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

// TODO: Test token creation and trigger that creates expiration date
