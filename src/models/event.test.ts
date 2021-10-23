import DBConnection from "../../test/util/db_connection";
import ModelTestPass from "../../test/jest/helpers/model/test/pass";
import ModelTestFail from "../../test/jest/helpers/model/test/fail";
import BaseWorld from "../../test/support/base_world";
import Event, { EventAttributes } from "./event";
import {
    createModels,
    loadAttributes,
} from "../../test/jest/helpers/model/test/setup";
import { teardown } from "../../test/jest/helpers/model/test/teardown";

let baseWorld: BaseWorld | undefined;

beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, Event);
    await createModels(baseWorld, Event);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    await teardown<Event>(baseWorld, Event);
    baseWorld = undefined;
});

test("Create Event", async () => {
    await ModelTestPass.create<Event, EventAttributes>(baseWorld, Event);
});

test("Create Event without user_id or business_id", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const eventAttrs =
        baseWorld.getCustomProp<EventAttributes>("eventAttributes");
    eventAttrs.business_id = null;
    eventAttrs.user_id = null;
    baseWorld?.setCustomProp<EventAttributes>("eventAttributes", eventAttrs);

    await ModelTestFail.create<Event, EventAttributes>(
        baseWorld,
        Event,
        /EventInsertError: Must have either business_id or user_id/
    );
});

test("Update Event should fail", async () => {
    await ModelTestFail.update<Event, EventAttributes>(
        baseWorld,
        Event,
        {
            status: "PASS",
        },
        /EventUpdateError: Cannot update events/
    );
});

test("Delete Event", async () => {
    jest.setTimeout(10000);
    await ModelTestPass.delete<Event, EventAttributes>(baseWorld, Event, [
        "id",
    ]);
});

test("Read Event", async () => {
    jest.setTimeout(10000);
    await ModelTestPass.read<Event, EventAttributes>(baseWorld, Event, ["id"]);
});
