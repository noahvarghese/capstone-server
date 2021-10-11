import { Entity, Column } from "typeorm";
import { AttributeFactory } from "../abstract/base_model";
import EditableContentModel from "../abstract/editable_content_model";

export interface QuizAttributes {
    title: string;
    max_attempts: number;
    manual_id: number;
    prevent_delete: boolean;
    prevent_edit: boolean;
    updated_by_user_id: number;
}

export const EmptyQuizAttributes = (): QuizAttributes => ({
    title: "",
    max_attempts: -1,
    manual_id: -1,
    prevent_delete: false,
    prevent_edit: false,
    updated_by_user_id: -1,
});

@Entity({ name: "quiz" })
export default class Quiz
    extends EditableContentModel
    implements QuizAttributes
{
    @Column()
    public title!: string;
    @Column()
    public max_attempts!: number;
    @Column()
    public manual_id!: number;
    @Column()
    public prevent_delete!: boolean;
    @Column()
    public prevent_edit!: boolean;

    public constructor(options?: Partial<QuizAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyQuizAttributes));
    }
}
