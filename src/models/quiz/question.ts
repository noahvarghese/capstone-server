import { Entity, Column } from "typeorm";
import EditableContentModel from "../abstract/editable_content_model";

interface QuestionAttributes {
    question: string;
    type: string;
    section_id: number;
    updated_by_user_id: number;
}

const EmptyQuestionAttributes = (): QuestionAttributes => ({
    question: "",
    type: "",
    section_id: -1,
    updated_by_user_id: -1,
});

const QuestionBuilder = <T extends Partial<QuestionAttributes>>(
    options?: T
): QuestionAttributes & T => Object.assign(EmptyQuestionAttributes(), options);

@Entity({ name: "quiz_question" })
export default class Question
    extends EditableContentModel
    implements QuestionAttributes {
    @Column()
    public question!: string;
    @Column()
    public type!: string;
    @Column()
    public section_id!: number;

    public constructor(options?: Partial<QuestionAttributes>) {
        super();
        const attr = QuestionBuilder(options);
        Object.assign(this, attr);
    }
}
