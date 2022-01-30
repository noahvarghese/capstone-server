import { Entity, Column } from "typeorm";
import BaseModel, { AttributeFactory } from "../abstract/base_model";

export interface QuizAttemptAttributes {
    user_id: number;
    quiz_id: number;
}

export const EmptyAttemptAttributes = (): QuizAttemptAttributes => ({
    user_id: NaN,
    quiz_id: NaN,
});

@Entity({ name: "quiz_attempt" })
export default class QuizAttempt
    extends BaseModel
    implements QuizAttemptAttributes
{
    @Column()
    public user_id!: number;
    @Column()
    public quiz_id!: number;

    public constructor(options?: Partial<QuizAttemptAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyAttemptAttributes));
    }
}
