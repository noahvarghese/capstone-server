import { AttributeFactory } from "@models/abstract/base_model";
import EditableContentModel from "@models/abstract/editable_content_model";
import { Entity, Column } from "typeorm";

export interface QuizQuestionTypeAttributes {
    question_type: "multiple choice" | "single choice";
    html_tag: string;
    // Actually JSON string, needs to be parsed to use
    html_attributes: string;
}

export const EmptyQuizQuestionTypeAttributes = (): QuizQuestionTypeAttributes => ({
    question_type: "multiple choice",
    html_tag: "",
    html_attributes: ""
});

@Entity({ name: "quiz_question_type" })
export default class QuizQuestionType 
    extends EditableContentModel
    implements QuizQuestionTypeAttributes 
{
    @Column()
    public question_type!: "multiple choice";
    @Column()
    public html_tag!: string;
    @Column()
    public html_attributes!: string;

    public constructor(options?: Partial<QuizQuestionTypeAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyQuizQuestionTypeAttributes));
    }
}

