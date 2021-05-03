import { Entity, Column } from "typeorm";
import EditableContentModel from "../abstract/editable_content_model";

export interface ManualAttributes {
    title: string;
    role_id: number;
    department_id: number;
    updated_by_user_id: number;
}

const EmptyManualAttributes = (): ManualAttributes => ({
    title: "",
    department_id: -1,
    role_id: -1,
    updated_by_user_id: -1,
});

const ManualBuilder = <T extends Partial<ManualAttributes>>(
    options?: T
): ManualAttributes & T => Object.assign(EmptyManualAttributes(), options);

@Entity({ name: "manual" })
export default class Manual
    extends EditableContentModel
    implements ManualAttributes {
    @Column()
    public title!: string;
    @Column()
    public department_id!: number;
    @Column()
    public role_id!: number;

    public constructor(options?: Partial<ManualAttributes>) {
        super();
        const attr = ManualBuilder(options);
        Object.assign(this, attr);
    }
}
