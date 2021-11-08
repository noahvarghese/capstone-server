import { CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

export default abstract class EventDates {
    @CreateDateColumn()
    public readonly created_on!: Date;
    @UpdateDateColumn()
    public readonly updated_on!: Date;
    @DeleteDateColumn()
    public readonly deleted_on!: Date;
}
