import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from "typeorm";

export interface EventAttributes {
    name: string;
    status: "PASS" | "FAIL";
    user_id: number;
}

const EmptyEventAttributes = (): EventAttributes => ({
    name: "",
    status: "FAIL",
    user_id: -1,
});

const EventBuilder = <T extends Partial<EventAttributes>>(
    options?: T
): EventAttributes & T => Object.assign(EmptyEventAttributes(), options);

@Entity()
export default class Event implements EventAttributes {
    @PrimaryGeneratedColumn()
    public id!: number;
    @Column()
    public name!: string;
    @Column()
    public status!: "PASS" | "FAIL";
    @Column()
    public user_id!: number;
    @CreateDateColumn()
    public created_on!: Date;

    public constructor(options?: Partial<EventAttributes>) {
        const attr = EventBuilder(options);
        Object.assign(this, attr);
    }
}
