import { Entity, Column } from "typeorm";
import PrimaryKey from "../abstract/base_model";

interface PolicyAttributes {
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

@Entity()
export default class Policy extends PrimaryKey implements PolicyAttributes {
    @Column()
    public title!: string;
    @Column()
    public section_id!: number;
    @Column()
    public updated_by_user_id!: number;

    public constructor(options?: Partial<PolicyAttributes>) {
        super();
        const attr = PolicyBuilder(options);
        Object.assign(this, attr);
    }
}
