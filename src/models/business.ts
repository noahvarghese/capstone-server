import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from "typeorm";

interface BusinessAttributes {
    name: string;
    address: string;
    city: string;
    postal_code: string;
    province: string;
    country: string;
}

const EmptyBusiness = (): BusinessAttributes => ({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    province: "",
    country: "",
});

const BusinessBuilder = <T extends Partial<BusinessAttributes>>(
    options?: T
): BusinessAttributes & T => {
    return Object.assign(EmptyBusiness(), options);
};

@Entity()
export default class Business implements BusinessAttributes {
    @PrimaryGeneratedColumn()
    public id!: number;
    @Column()
    public name!: string;
    @Column()
    public address!: string;
    @Column()
    public city!: string;
    @Column()
    public postal_code!: string;
    @Column()
    public province!: string;
    @Column()
    public country!: string;
    @CreateDateColumn()
    public readonly created_on!: Date;
    @UpdateDateColumn()
    public readonly updated_on!: Date;
    @DeleteDateColumn()
    public readonly deleted_on!: Date;

    public constructor(options?: Partial<BusinessAttributes>) {
        const businessAttr = BusinessBuilder(options);
        Object.assign(this, businessAttr);
    }
}
