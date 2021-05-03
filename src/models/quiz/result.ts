import { Entity, Column } from "typeorm";
import BaseModel from "../abstract/base_model";

export interface ResultAttributes {
    quiz_attempt_id: number;
    quiz_question_id: number;
    quiz_answer_id: number;
}

const EmptyResultAttributes = (): ResultAttributes => ({
    quiz_attempt_id: -1,
    quiz_question_id: -1,
    quiz_answer_id: -1,
});

const ResultBuilder = <T extends Partial<ResultAttributes>>(
    options?: T
): ResultAttributes & T => Object.assign(EmptyResultAttributes(), options);

@Entity({ name: "quiz_result" })
export default class Result extends BaseModel implements ResultAttributes {
    @Column()
    public quiz_attempt_id!: number;
    @Column()
    public quiz_question_id!: number;
    @Column()
    public quiz_answer_id!: number;

    public constructor(options?: Partial<ResultAttributes>) {
        super();
        const attr = ResultBuilder(options);
        Object.assign(this, attr);
    }
}
