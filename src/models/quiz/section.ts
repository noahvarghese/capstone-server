import { Entity, Column } from "typeorm";
import PrimaryKey from "../abstract/base_model";

interface SectionAttributes {
    title: string;
    quiz_id: number;
    updated_by_user_id: number;
}

const EmptySectionAttributes = (): SectionAttributes => ({
    title: "",
    quiz_id: -1,
    updated_by_user_id: -1,
});

const SectionBuilder = <T extends Partial<SectionAttributes>>(
    options?: T
): SectionAttributes & T => Object.assign(EmptySectionAttributes(), options);

@Entity()
export default class Section extends PrimaryKey implements SectionAttributes {
    @Column()
    public title!: string;
    @Column()
    public quiz_id!: number;
    @Column()
    public updated_by_user_id!: number;

    public constructor(options?: Partial<SectionAttributes>) {
        super();
        const attr = SectionBuilder(options);
        Object.assign(this, attr);
    }
}
