import { BeforeAll, AfterAll } from "@cucumber/cucumber";
import Business from "../../src/models/business";
import User from "../../src/models/user/user";
import {
    businessAttributes,
    userAttributes,
} from "../sample_data.ts/attributes";
import DBConnection from "../util/db_connection";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const models: any[] = [];

BeforeAll(async function () {
    // Set DB Connection
    await DBConnection.InitConnection();

    // Create business
    const business = await (
        await DBConnection.GetConnection()
    ).manager.save(Business, businessAttributes);

    // Create user
    let user = new User(userAttributes);
    await user.hashPassword(user.password);
    user.business_id = business.id;

    user = await (await DBConnection.GetConnection()).manager.save(User, user);

    // Reverse order as user needs to be deleted before business
    models.push({ model: user, type: User });
    models.push({ model: business, type: Business });
    return;
});

AfterAll({ timeout: 10000 }, async function () {
    // Delete rows
    for (const item of models) {
        await (
            await DBConnection.GetConnection()
        ).manager.remove(item.type, item.model);
    }
    return;
});
