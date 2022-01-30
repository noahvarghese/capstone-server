import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import ModelTestParentPrevent from "@test/model/helpers/test/parent_prevent";
import Quiz, { QuizAttributes } from "./quiz";
import QuizSection, { QuizSectionAttributes } from "./section";
import Model from "@test/model/helpers";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Model.setup.call(baseWorld, QuizSection);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, QuizSection);
    baseWorld.resetProps();
});

// Tests
test("Create Quiz QuizSection", async () => {
    await ModelTestPass.create<QuizSection, QuizSectionAttributes>(
        baseWorld,
        QuizSection
    );
});

test("Update Quiz QuizSection", async () => {
    await ModelTestPass.update<QuizSection, QuizSectionAttributes>(
        baseWorld,
        QuizSection,
        {
            title: "TEST",
        }
    );
});

test("Delete Quiz QuizSection", async () => {
    await ModelTestPass.delete<QuizSection, QuizSectionAttributes>(
        baseWorld,
        QuizSection,

        ["id"]
    );
});

test("Read Quiz QuizSection", async () => {
    await ModelTestPass.read<QuizSection, QuizSectionAttributes>(
        baseWorld,
        QuizSection,
        ["id"]
    );
});

test("Delete Question while Manual is locked doesn't work", async () => {
    await ModelTestParentPrevent.delete<
        Quiz,
        QuizAttributes,
        QuizSection,
        QuizSectionAttributes
    >(
        baseWorld,
        { type: Quiz, toggleAttribute: "prevent_edit" },
        QuizSection,
        /QuizSectionDeleteError: Cannot delete a section while the quiz is locked from editing/
    );
});

test("Update Question while Quiz is locked doesn't work", async () => {
    await ModelTestParentPrevent.update<
        Quiz,
        QuizAttributes,
        QuizSection,
        QuizSectionAttributes
    >(
        baseWorld,
        { type: Quiz, toggleAttribute: "prevent_edit" },
        {
            type: QuizSection,
            attributesToUpdate: { title: "YOLO" },
        },
        /QuizSectionUpdateError: Cannot update a section while the quiz is locked from editing/
    );
});

test("Creating section when quiz.prevent_edit is true should fail", async () => {
    await ModelTestParentPrevent.create<
        Quiz,
        QuizAttributes,
        QuizSection,
        QuizSectionAttributes
    >(
        baseWorld,
        { type: Quiz, toggleAttribute: "prevent_edit" },
        QuizSection,
        /QuizSectionInsertError: Cannot insert a section while the quiz is locked/
    );
});