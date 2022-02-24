import { Entity, Column } from "typeorm";
import { AttributeFactory } from "../abstract/base_model";
import EditableContentModel from "../abstract/editable_content_model";

export interface ManualSectionAttributes {
    title: string;
    manual_id: number;
    updated_by_user_id: number;
}

export const EmptyManualSectionAttributes = (): ManualSectionAttributes => ({
    title: "",
    manual_id: NaN,
    updated_by_user_id: NaN,
});

@Entity({ name: "manual_section" })
export default class ManualSection
    extends EditableContentModel
    implements ManualSectionAttributes
{
    @Column()
    public title!: string;
    @Column()
    public manual_id!: number;

    public constructor(options?: Partial<ManualSectionAttributes>) {
        super();
        Object.assign(
            this,
            AttributeFactory(options, EmptyManualSectionAttributes)
        );
    }
}
