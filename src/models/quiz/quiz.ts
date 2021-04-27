import { Entity, Column } from "typeorm";
import PrimaryKey from "../abstract/base_model";

interface QuizAttributes {
    title: string;
    max_attempts: number;
    manual_id: number;
    updated_by_user_id: number;
}

const EmptyQuizAttributes = (): QuizAttributes => ({
    title: "",
    max_attempts: -1,
    manual_id: -1,
    updated_by_user_id: -1,
});

const QuizBuilder = <T extends Partial<QuizAttributes>>(
    options?: T
): QuizAttributes & T => Object.assign(EmptyQuizAttributes(), options);

@Entity()
export default class Quiz extends PrimaryKey implements QuizAttributes {
    @Column()
    public title!: string;
    @Column()
    public max_attempts!: number;
    @Column()
    public manual_id!: number;
    @Column()
    public updated_by_user_id!: number;

    public constructor(options?: Partial<QuizAttributes>) {
        super();
        const attr = QuizBuilder(options);
        Object.assign(this, attr);
    }
}
