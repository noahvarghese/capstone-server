import { Entity, Column } from "typeorm";
import { AttributeFactory } from "../abstract/base_model";
import EditableContentModel from "../abstract/editable_content_model";

export interface QuizSectionAttributes {
    title: string;
    quiz_id: number;
    updated_by_user_id: number;
}

export const EmptyQuizSectionAttributes = (): QuizSectionAttributes => ({
    title: "",
    quiz_id: -1,
    updated_by_user_id: -1,
});

@Entity({ name: "quiz_section" })
export default class QuizSection
    extends EditableContentModel
    implements QuizSectionAttributes
{
    @Column()
    public title!: string;
    @Column()
    public quiz_id!: number;

    public constructor(options?: Partial<QuizSectionAttributes>) {
        super();
        Object.assign(
            this,
            AttributeFactory(options, EmptyQuizSectionAttributes)
        );
    }
}
