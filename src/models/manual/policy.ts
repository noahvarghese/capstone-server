import { Entity, Column } from "typeorm";
import EditableContentModel from "../abstract/editable_content_model";

export interface PolicyAttributes {
    title: string;
    section_id: number;
    updated_by_user_id: number;
}

const EmptyPolicyAttributes = (): PolicyAttributes => ({
    title: "",
    section_id: -1,
    updated_by_user_id: -1,
});

const PolicyBuilder = <T extends Partial<PolicyAttributes>>(
    options?: T
): PolicyAttributes & T => Object.assign(EmptyPolicyAttributes(), options);

@Entity({ name: "policy" })
export default class Policy
    extends EditableContentModel
    implements PolicyAttributes {
    @Column()
    public title!: string;
    @Column()
    public section_id!: number;

    public constructor(options?: Partial<PolicyAttributes>) {
        super();
        const attr = PolicyBuilder(options);
        Object.assign(this, attr);
    }
}
