import { Entity, Column } from "typeorm";
import EditableContentModel from "../../abstract/editable_content_model";

export interface QuizAnswerAttributes {
    answer: string;
    correct: boolean;
    quiz_question_id: number;
    updated_by_user_id: number;
}

const EmptyAnswerAttributes = (): QuizAnswerAttributes => ({
    answer: "",
    correct: false,
    quiz_question_id: -1,
    updated_by_user_id: -1,
});

const AnswerBuilder = <T extends Partial<QuizAnswerAttributes>>(
    options?: T
): QuizAnswerAttributes & T => Object.assign(EmptyAnswerAttributes(), options);

@Entity({ name: "quiz_answer" })
export default class QuizAnswer
    extends EditableContentModel
    implements QuizAnswerAttributes
{
    @Column()
    public answer!: string;
    @Column()
    public correct!: boolean;
    @Column()
    public quiz_question_id!: number;

    public constructor(options?: Partial<QuizAnswerAttributes>) {
        super();
        const attr = AnswerBuilder(options);
        Object.assign(this, attr);
    }
}
