import { Entity, Column } from "typeorm";
import { AttributeFactory } from "../abstract/base_model";
import EditableContentModel from "../abstract/editable_content_model";

export interface ManualAttributes {
    title: string;
    prevent_delete: boolean;
    prevent_edit: boolean;
    published: boolean;
    updated_by_user_id: number;
}

export const EmptyManualAttributes = (): ManualAttributes => ({
    title: "",
    prevent_delete: false,
    prevent_edit: false,
    published: false,
    updated_by_user_id: NaN,
});

@Entity({ name: "manual" })
export default class Manual
    extends EditableContentModel
    implements ManualAttributes
{
    @Column()
    public title!: string;
    @Column()
    public prevent_delete!: boolean;
    @Column()
    public prevent_edit!: boolean;
    @Column()
    public published!: boolean;

    public constructor(options?: Partial<ManualAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyManualAttributes));
    }
}
