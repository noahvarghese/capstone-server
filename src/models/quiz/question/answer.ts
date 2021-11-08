import { Entity, Column } from "typeorm";
import { AttributeFactory } from "../../abstract/base_model";
import EditableContentModel from "../../abstract/editable_content_model";

export interface QuizAnswerAttributes {
    answer: string;
    correct: boolean;
    quiz_question_id: number;
    updated_by_user_id: number;
}

export const EmptyAnswerAttributes = (): QuizAnswerAttributes => ({
    answer: "",
    correct: false,
    quiz_question_id: -1,
    updated_by_user_id: -1,
});

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
        Object.assign(this, AttributeFactory(options, EmptyAnswerAttributes));
    }
}
