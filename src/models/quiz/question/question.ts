import { Entity, Column } from "typeorm";
import EditableContentModel from "../../abstract/editable_content_model";

export interface QuizQuestionAttributes {
    question: string;
    type: string;
    quiz_section_id: number;
    updated_by_user_id: number;
}

const EmptyQuestionAttributes = (): QuizQuestionAttributes => ({
    question: "",
    type: "",
    quiz_section_id: -1,
    updated_by_user_id: -1,
});

const QuizQuestionBuilder = <T extends Partial<QuizQuestionAttributes>>(
    options?: T
): QuizQuestionAttributes & T =>
    Object.assign(EmptyQuestionAttributes(), options);

@Entity({ name: "quiz_question" })
export default class QuizQuestion
    extends EditableContentModel
    implements QuizQuestionAttributes
{
    @Column()
    public question!: string;
    @Column()
    public type!: string;
    @Column()
    public quiz_section_id!: number;

    public constructor(options?: Partial<QuizQuestionAttributes>) {
        super();
        const attr = QuizQuestionBuilder(options);
        Object.assign(this, attr);
    }
}
