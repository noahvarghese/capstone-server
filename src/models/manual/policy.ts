import { Entity, Column } from "typeorm";
import { AttributeFactory } from "../abstract/base_model";
import EditableContentModel from "../abstract/editable_content_model";

export interface PolicyAttributes {
    title: string;
    manual_section_id: number;
    updated_by_user_id: number;
}

export const EmptyPolicyAttributes = (): PolicyAttributes => ({
    title: "",
    manual_section_id: NaN,
    updated_by_user_id: NaN,
});

@Entity({ name: "policy" })
export default class Policy
    extends EditableContentModel
    implements PolicyAttributes
{
    @Column()
    public title!: string;
    @Column()
    public manual_section_id!: number;

    public constructor(options?: Partial<PolicyAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyPolicyAttributes));
    }
}
