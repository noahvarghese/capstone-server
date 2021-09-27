import { Entity, Column } from "typeorm";
import BaseModel from "../abstract/base_model";

export interface QuizAttemptAttributes {
    user_id: number;
    quiz_id: number;
}

const EmptyAttemptAttributes = (): QuizAttemptAttributes => ({
    user_id: -1,
    quiz_id: -1,
});

const AttemptBuilder = <T extends Partial<QuizAttemptAttributes>>(
    options?: T
): QuizAttemptAttributes & T =>
    Object.assign(EmptyAttemptAttributes(), options);

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
        const attr = AttemptBuilder(options);
        Object.assign(this, attr);
    }
}
