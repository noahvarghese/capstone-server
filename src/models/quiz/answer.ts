import { Entity, Column } from "typeorm";
import EditableContentModel from "../abstract/editable_content_model";

interface AnswerAttributes {
    answer: string;
    correct: boolean;
    question_id: number;
    updated_by_user_id: number;
}

const EmptyAnswerAttributes = (): AnswerAttributes => ({
    answer: "",
    correct: false,
    question_id: -1,
    updated_by_user_id: -1,
});

const AnswerBuilder = <T extends Partial<AnswerAttributes>>(
    options?: T
): AnswerAttributes & T => Object.assign(EmptyAnswerAttributes(), options);

@Entity({ name: "quiz_answer" })
export default class Answer
    extends EditableContentModel
    implements AnswerAttributes {
    @Column()
    public answer!: string;
    @Column()
    public correct!: boolean;
    @Column()
    public question_id!: number;

    public constructor(options?: Partial<AnswerAttributes>) {
        super();
        const attr = AnswerBuilder(options);
        Object.assign(this, attr);
    }
}
