import { Entity, Column } from "typeorm";
import BaseModel, { AttributeFactory } from "../abstract/base_model";

export interface QuizResultAttributes {
    quiz_attempt_id: number;
    quiz_question_id: number;
    quiz_answer_id: number;
}

export const EmptyResultAttributes = (): QuizResultAttributes => ({
    quiz_attempt_id: -1,
    quiz_question_id: -1,
    quiz_answer_id: -1,
});

@Entity({ name: "quiz_result" })
export default class QuizResult
    extends BaseModel
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
