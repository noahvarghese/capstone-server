import { Entity, PrimaryColumn } from "typeorm";
import EventDates from "../abstract/event_dates";

export interface ReadAttributes {
    user_id: number;
    policy_id: number;
}

const EmptyReadAttributes = (): ReadAttributes => ({
    user_id: -1,
    policy_id: -1,
});

const ReadBuilder = <T extends Partial<ReadAttributes>>(
    options?: T
): ReadAttributes & T => Object.assign(EmptyReadAttributes(), options);

@Entity({ name: "policy_read" })
export default class Read extends EventDates implements ReadAttributes {
    @PrimaryColumn()
    public user_id!: number;
    @PrimaryColumn()
    public policy_id!: number;

    public constructor(options?: Partial<ReadAttributes>) {
        super();
        const attr = ReadBuilder(options);
        Object.assign(this, attr);
    }
}
