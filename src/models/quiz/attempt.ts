import { Entity, Column } from "typeorm";
import BaseModel from "../abstract/base_model";

export interface AttemptAttributes {
    user_id: number;
    quiz_id: number;
}

const EmptyAttemptAttributes = (): AttemptAttributes => ({
    user_id: -1,
    quiz_id: -1,
});

const AttemptBuilder = <T extends Partial<AttemptAttributes>>(
    options?: T
): AttemptAttributes & T => Object.assign(EmptyAttemptAttributes(), options);

@Entity({ name: "quiz_attempt" })
export default class Attempt extends BaseModel implements AttemptAttributes {
    @Column()
    public user_id!: number;
    @Column()
    public quiz_id!: number;

    public constructor(options?: Partial<AttemptAttributes>) {
        super();
        const attr = AttemptBuilder(options);
        Object.assign(this, attr);
    }
}
