import { Entity, Column } from "typeorm";
import EditableContentModel from "../abstract/editable_content_model";

export interface ContentAttributes {
    title: string;
    content: string;
    policy_id: number;
    updated_by_user_id: number;
}

const EmptyContentAttributes = (): ContentAttributes => ({
    title: "",
    content: "",
    policy_id: -1,
    updated_by_user_id: -1,
});

const ContentBuilder = <T extends Partial<ContentAttributes>>(
    options?: T
): ContentAttributes & T => Object.assign(EmptyContentAttributes(), options);

@Entity({ name: "content" })
export default class Content
    extends EditableContentModel
    implements ContentAttributes {
    @Column()
    public title!: string;
    @Column()
    public content!: string;
    @Column()
    public policy_id!: number;

    public constructor(options?: Partial<ContentAttributes>) {
        super();
        const attr = ContentBuilder(options);
        Object.assign(this, attr);
    }
}
