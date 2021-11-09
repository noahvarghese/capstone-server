import { Entity, Column } from "typeorm";
import { AttributeFactory } from "../abstract/base_model";
import EditableContentModel from "../abstract/editable_content_model";

export interface ManualAttributes {
    title: string;
    prevent_delete: boolean;
    prevent_edit: boolean;
    updated_by_user_id: number;
}

export const EmptyManualAttributes = (): ManualAttributes => ({
    title: "",
    prevent_delete: false,
    prevent_edit: false,
    updated_by_user_id: -1,
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

    public constructor(options?: Partial<ManualAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyManualAttributes));
    }
}
