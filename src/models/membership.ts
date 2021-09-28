import { Entity, PrimaryColumn } from "typeorm";
import EventDates from "./abstract/event_dates";

export interface MembershipAttributes {
    user_id: number | null;
    business_id: number | null;
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
export default class Membership
    extends EventDates
    implements MembershipAttributes
{
    @PrimaryColumn()
    public user_id!: number;
    @PrimaryColumn()
    public business_id!: number;

    public constructor(options?: Partial<MembershipAttributes>) {
        super();
        Object.assign(this, MembershipBuilder(options));
    }
}
