import { exec } from "child_process";
import {
    businessAttributes,
    eventAttributes,
    userAttributes,
} from "../../test/sample_data.ts/attributes";
import DBConnection from "../../test/util/db_connection";
import {
    createModel,
    deleteModel,
    modelMatchesInterface,
} from "../../test/util/model_actions";
import {
    testDeleteModelFail,
    testReadModel,
} from "../../test/util/model_compare";
import BaseWorld from "../../test/util/store";
import Business, { BusinessAttributes } from "./business";
import Event, { EventAttributes } from "./event";
import User, { UserAttributes } from "./user/user";

let baseWorld: BaseWorld | undefined;
const key = "event";

beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());

    baseWorld.setCustomProp<BusinessAttributes>(
        "businessAttributes",
        businessAttributes
    );

    baseWorld.setCustomProp<UserAttributes>("userAttributes", userAttributes);

    baseWorld.setCustomProp<EventAttributes>(
        "eventAttributes",
        eventAttributes
    );
});

afterEach(() => {
    baseWorld = undefined;
});

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

    const user = await createModel<User, UserAttributes>(
        baseWorld,
        User,
        "user"
    );

    baseWorld.setCustomProp<EventAttributes>("eventAttributes", {
        ...baseWorld.getCustomProp<EventAttributes>("eventAttributes"),
        user_id: user.id,
    });
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await new Promise((res, rej) => {
        exec(
            "python ./bin/reset_db.py -t --files ./database/ --path .env",
            (err, stdout, stderr) => {
                if (stdout) {
                    console.log(stdout);
                }
                if (err) {
                    rej(`${err}\n${stderr}`);
                }
                res(stdout);
            }
        );
    });
});

test("Create Event", async () => {
    jest.setTimeout(10000);

    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const model = await createModel<Event, EventAttributes>(
        baseWorld,
        Event,
        key
    );

    if (model.id) {
        expect(model.id).toBeGreaterThan(0);
    }

    expect(
        modelMatchesInterface(
            baseWorld.getCustomProp<EventAttributes>(`${key}Attributes`),
            model
        )
    ).toBe(true);
});

test("Update Event", async () => {
    jest.setTimeout(10000);
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const modelAttributesName = `${key}Attributes`;
    const { connection } = baseWorld;

    let model = await createModel<Event, EventAttributes>(
        baseWorld,
        Event,
        key
    );

    baseWorld.setCustomProp<EventAttributes>(modelAttributesName, {
        ...baseWorld.getCustomProp<EventAttributes>(modelAttributesName),
        ["name"]: "TEST",
    });

    if (
        model["name"] ===
        baseWorld.getCustomProp<EventAttributes>(modelAttributesName).name
    ) {
        throw new Error("Object hasn't changed");
    }

    try {
        model = await connection.manager.save(model);
    } catch (e: any) {
        expect(e).toBeTruthy();
        // expect(e.Message).toContain("EventUpdateError: Cannot update events");
    }

    expect(
        modelMatchesInterface(
            baseWorld.getCustomProp<EventAttributes>(modelAttributesName),
            model
        )
    ).toBe(false);
});

test("Delete Event", async () => {
    jest.setTimeout(10000);
    await testDeleteModelFail<Event, EventAttributes>(baseWorld, Event, key, [
        "id",
    ]);
});

test("Read Event", async () => {
    jest.setTimeout(10000);
    await testReadModel<Event, EventAttributes>(
        baseWorld,
        Event,
        key,
        ["id"],
        false
    );
});
