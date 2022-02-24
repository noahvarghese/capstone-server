import { Entity, Column } from "typeorm";
import { AttributeFactory } from "@models/abstract/base_model";
import EditableContentModel from "@models/abstract/editable_content_model";

export interface ContentAttributes {
    title: string;
    content: string;
    manual_section_id: number;
    updated_by_user_id: number;
}

export const EmptyContentAttributes = (): ContentAttributes => ({
    title: "",
    content: "",
    manual_section_id: NaN,
    updated_by_user_id: NaN,
});

@Entity({ name: "content" })
export default class Content
    extends EditableContentModel
    implements ContentAttributes
{
    @Column()
    public title!: string;
    @Column()
    public content!: string;
    @Column()
    public manual_section_id!: number;

    public constructor(options?: Partial<ContentAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyContentAttributes));
    }
}
