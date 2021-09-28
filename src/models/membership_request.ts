import { uid } from "rand-token";
import { Column, Entity, PrimaryColumn } from "typeorm";
import { AttributeFactory } from "./abstract/base_model";
import EventDates from "./abstract/event_dates";

export interface MembershipRequestAttributes {
    user_id: number | null;
    business_id: number | null;
    token: string;
    token_expiry: Date;
}

export const EmptyMembershipRequestAttributes =
    (): MembershipRequestAttributes => ({
        user_id: -1,
        business_id: -1,
        token: "",
        // sets date to 24 hours from now
        token_expiry: new Date(new Date().setHours(new Date().getHours() + 24)),
    });

@Entity()
export default class MembershipRequest
    extends EventDates
    implements MembershipRequestAttributes
{
    @PrimaryColumn()
    public user_id!: number;
    @PrimaryColumn()
    public business_id!: number;
    @Column()
    public token!: string;
    @Column()
    public token_expiry!: Date;

    public constructor(options?: Partial<MembershipRequestAttributes>) {
        super();

        Object.assign(
            this,
            AttributeFactory(options, EmptyMembershipRequestAttributes)
        );

        this.token = uid(32);

        const tokenExpiry = new Date();
        // set to 24 hours after current date
        tokenExpiry.setHours(tokenExpiry.getHours() + 24);

        this.token_expiry = tokenExpiry;
    }
}
