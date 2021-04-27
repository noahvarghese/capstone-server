import { Entity, Column } from "typeorm";
import PrimaryKey from "../abstract/base_model";

interface ContentAttributes {
    title: string;
    content: string;
    policy_id: number;
    updated_by_user_id: number;
}

const EmptyContentAttributes = (): ContentAttributes => ({
    title: "",
    content: "",
    policy_id: -1,
    updated_by_user_id: -1,
});

const ContentBuilder = <T extends Partial<ContentAttributes>>(
    options?: T
): ContentAttributes & T => Object.assign(EmptyContentAttributes(), options);

@Entity()
export default class Content extends PrimaryKey implements ContentAttributes {
    @Column()
    public title!: string;
    @Column()
    public content!: string;
    @Column()
    public policy_id!: number;
    @Column()
    public updated_by_user_id!: number;

    public constructor(options?: Partial<ContentAttributes>) {
        super();
        const attr = ContentBuilder(options);
        Object.assign(this, attr);
    }
}
