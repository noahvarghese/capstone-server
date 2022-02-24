import { Entity, Column, PrimaryColumn } from "typeorm";
import { AttributeFactory } from "../abstract/base_model";
import EventDates from "../abstract/event_dates";

export interface UserRoleAttributes {
    user_id: number;
    role_id: number;
    updated_by_user_id: number;
}

export const EmptyUserRoleAttributes = (): UserRoleAttributes => ({
    user_id: NaN,
    role_id: NaN,
    updated_by_user_id: NaN,
});

@Entity({ name: "user_role" })
export default class UserRole extends EventDates implements UserRoleAttributes {
    @PrimaryColumn()
    public user_id!: number;
    @PrimaryColumn()
    public role_id!: number;
    @Column()
    public updated_by_user_id!: number;

    public constructor(options?: Partial<UserRoleAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyUserRoleAttributes));
    }
}
