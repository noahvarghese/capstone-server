import { Entity, Column } from "typeorm";
import { AttributeFactory } from "../../abstract/base_model";
import EditableContentModel from "../../abstract/editable_content_model";

export interface QuizQuestionAttributes {
    question: string;
    quiz_question_type_id: number;
    quiz_section_id: number;
    updated_by_user_id: number;
}

export const EmptyQuestionAttributes = (): QuizQuestionAttributes => ({
    question: "",
    quiz_question_type_id: NaN,
    quiz_section_id: NaN,
    updated_by_user_id: NaN,
});

@Entity({ name: "quiz_question" })
export default class QuizQuestion
    extends EditableContentModel
    implements QuizQuestionAttributes
{
    @Column()
    public question!: string;
    @Column()
    public quiz_question_type_id!: number;
    @Column()
    public quiz_section_id!: number;

    public constructor(options?: Partial<QuizQuestionAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyQuestionAttributes));
    }
}
