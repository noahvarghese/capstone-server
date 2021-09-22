import { Entity, Column } from "typeorm";
import EditableContentModel from "../abstract/editable_content_model";

export interface ManualSectionAttributes {
    title: string;
    manual_id: number;
    updated_by_user_id: number;
}

const EmptySectionAttributes = (): ManualSectionAttributes => ({
    title: "",
    manual_id: -1,
    updated_by_user_id: -1,
});

const SectionBuilder = <T extends Partial<ManualSectionAttributes>>(
    options?: T
): ManualSectionAttributes & T =>
    Object.assign(EmptySectionAttributes(), options);

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
        const attr = SectionBuilder(options);
        Object.assign(this, attr);
    }
}
