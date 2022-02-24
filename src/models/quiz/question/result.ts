import { Entity, Column, PrimaryColumn } from "typeorm";
import { AttributeFactory } from "@models/abstract/base_model";
import EventDates from "@models/abstract/event_dates";

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
    extends EventDates
    implements QuizResultAttributes
{
    @PrimaryColumn()
    public quiz_attempt_id!: number;
    @PrimaryColumn()
    public quiz_question_id!: number;
    @PrimaryColumn()
    public quiz_answer_id!: number;
    @Column()
    public updated_by_user_id!: number;

    public constructor(options?: Partial<QuizResultAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyResultAttributes));
    }
}
