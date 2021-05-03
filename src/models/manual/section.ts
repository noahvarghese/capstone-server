import { Entity, Column } from "typeorm";
import EditableContentModel from "../abstract/editable_content_model";

export interface SectionAttributes {
    title: string;
    manual_id: number;
    updated_by_user_id: number;
}

const EmptySectionAttributes = (): SectionAttributes => ({
    title: "",
    manual_id: -1,
    updated_by_user_id: -1,
});

const SectionBuilder = <T extends Partial<SectionAttributes>>(
    options?: T
): SectionAttributes & T => Object.assign(EmptySectionAttributes(), options);

@Entity({ name: "section" })
export default class Section
    extends EditableContentModel
    implements SectionAttributes {
    @Column()
    public title!: string;
    @Column()
    public manual_id!: number;

    public constructor(options?: Partial<SectionAttributes>) {
        super();
        const attr = SectionBuilder(options);
        Object.assign(this, attr);
    }
}
