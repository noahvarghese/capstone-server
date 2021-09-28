import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    UpdateDateColumn,
} from "typeorm";

export interface MembershipAttributes {
    user_id: number;
    business_id: number;
}

const EmptyMembershipAttributes = (): MembershipAttributes => ({
    user_id: -1,
    business_id: -1,
});

const MembershipBuilder = <T extends Partial<MembershipAttributes>>(
    options?: T
) => {
    Object.assign(EmptyMembershipAttributes(), options);
};

@Entity()
export default class Membership implements MembershipAttributes {
    @Column()
    public user_id!: number;
    @Column()
    public business_id!: number;
    @CreateDateColumn()
    public created_on!: Date;
    @UpdateDateColumn()
    public updated_on!: Date;
    @DeleteDateColumn()
    public deleted_on!: Date;

    public constructor(options?: Partial<MembershipAttributes>) {
        Object.assign(this, MembershipBuilder(options));
    }
}
