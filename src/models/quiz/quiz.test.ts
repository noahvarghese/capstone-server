import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import ModelTestPass from "../../../test/helpers/model/test/pass";
import Quiz, { QuizAttributes } from "./quiz";
import {
    createModels,
    loadAttributes,
} from "../../../test/helpers/model/test/setup";
import { teardown } from "../../../test/helpers/model/test/teardown";
import ModelTestParentPrevent from "../../../test/helpers/model/test/parent_prevent";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, Quiz);
    await createModels(baseWorld, Quiz);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await teardown(baseWorld, Quiz);
    baseWorld = undefined;
});

// Tests
test("Create Quiz", async () => {
    await ModelTestPass.create<Quiz, QuizAttributes>(baseWorld, Quiz);
});

test("Update Quiz", async () => {
    await ModelTestPass.update<Quiz, QuizAttributes>(baseWorld, Quiz, {
        title: "TEST",
    });
});

test("Delete Quiz", async () => {
    await ModelTestPass.delete<Quiz, QuizAttributes>(baseWorld, Quiz, ["id"]);
});

test("Read Quiz", async () => {
    await ModelTestPass.read<Quiz, QuizAttributes>(baseWorld, Quiz, ["id"]);
});

test("Prevent Deletion of Quiz", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelTestParentPrevent.delete<
        Quiz,
        QuizAttributes,
        Quiz,
        QuizAttributes
    >(
        baseWorld,
        { type: Quiz, toggleAttribute: "prevent_delete" },
        Quiz,
        /QuizDeleteError: Cannot delete quiz while delete lock is set/
    );
});

test("prevent editing of quiz", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelTestParentPrevent.update<
        Quiz,
        QuizAttributes,
        Quiz,
        QuizAttributes
    >(
        baseWorld,
        { type: Quiz, toggleAttribute: "prevent_edit" },
        { type: Quiz, attributesToUpdate: { title: "YOLO" } },
        /QuizUpdateError: Quiz is locked from editing/
    );
});
