import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestParentPrevent from "@test/model/helpers/test/parent_prevent";
import Quiz, { QuizAttributes } from "./quiz";
import QuizSection, { QuizSectionAttributes } from "./section";
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
    await Model.setup.call(baseWorld, QuizSection);
});

afterEach(async () => {
    await Model.teardown.call(baseWorld, QuizSection);
    baseWorld.resetProps();
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
