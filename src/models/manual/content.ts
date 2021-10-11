import { Entity, Column } from "typeorm";
import { AttributeFactory } from "../abstract/base_model";
import EditableContentModel from "../abstract/editable_content_model";

export interface ContentAttributes {
    title: string;
    content: string;
    policy_id: number;
    updated_by_user_id: number;
}

export const EmptyContentAttributes = (): ContentAttributes => ({
    title: "",
    content: "",
    policy_id: -1,
    updated_by_user_id: -1,
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
    public policy_id!: number;

    public constructor(options?: Partial<ContentAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyContentAttributes));
    }
}
