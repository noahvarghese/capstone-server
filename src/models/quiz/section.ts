import { Entity, Column } from "typeorm";
import EditableContentModel from "../abstract/editable_content_model";

export interface QuizSectionAttributes {
    title: string;
    quiz_id: number;
    updated_by_user_id: number;
}

const EmptySectionAttributes = (): QuizSectionAttributes => ({
    title: "",
    quiz_id: -1,
    updated_by_user_id: -1,
});

const SectionBuilder = <T extends Partial<QuizSectionAttributes>>(
    options?: T
): QuizSectionAttributes & T =>
    Object.assign(EmptySectionAttributes(), options);

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
        const attr = SectionBuilder(options);
        Object.assign(this, attr);
    }
}
