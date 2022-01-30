import { Entity, Column } from "typeorm";
import { AttributeFactory } from "@models/abstract/base_model";
import EditableContentModel from "@models/abstract/editable_content_model";

export interface QuizResultAttributes {
    quiz_attempt_id: number;
    quiz_question_id: number;
    quiz_answer_id: number;
    updated_by_user_id: number;
}

export const EmptyResultAttributes = (): QuizResultAttributes => ({
    quiz_attempt_id: NaN,
    quiz_question_id: NaN,
    quiz_answer_id: NaN,
    updated_by_user_id: NaN,
});

@Entity({ name: "quiz_result" })
export default class QuizResult
    extends EditableContentModel
    implements QuizResultAttributes
{
    @Column()
    public quiz_attempt_id!: number;
    @Column()
    public quiz_question_id!: number;
    @Column()
    public quiz_answer_id!: number;

    public constructor(options?: Partial<QuizResultAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyResultAttributes));
    }
}
