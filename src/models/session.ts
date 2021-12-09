import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export default class Sessions {
    @PrimaryColumn()
    public session_id!: string;
    @Column({ unsigned: true })
    public expires!: number;
    @Column({ type: "mediumtext", nullable: true, default: null })
    public data!: string | null;
}
