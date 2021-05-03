import { Entity, Column, PrimaryColumn } from "typeorm";
import EventDates from "../abstract/event_dates";

export interface UserRoleAttributes {
    user_id: number;
    role_id: number;
    updated_by_user_id: number;
}

const EmptyUserRoleAttributes = (): UserRoleAttributes => ({
    user_id: -1,
    role_id: -1,
    updated_by_user_id: -1,
});

const UserRoleBuilder = <T extends Partial<UserRoleAttributes>>(
    options?: T
): UserRoleAttributes & T => Object.assign(EmptyUserRoleAttributes(), options);

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
        const attr = UserRoleBuilder(options);
        Object.assign(this, attr);
    }
}
