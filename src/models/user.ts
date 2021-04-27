import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from "typeorm";

interface UserAttributes {
    first_name: string;
    last_name: string;
    email: string;
    original_phone: string;
    phone: number;
    address: string;
    city: string;
    postal_code: string;
    province: string;
    country: string;
    birthday: Date;
    password: string;
    business_id: number;
}

const EmptyUserAttributes = () => ({
    first_name: "",
    last_name: "",
    email: "",
    original_phone: "",
    phone: -1,
    address: "",
    city: "",
    postal_code: "",
    province: "",
    country: "",
    birthday: "",
    password: "",
    business_id: -1,
});

const UserBuilder = <T extends Partial<UserAttributes>>(
    options?: T
): UserAttributes & T => Object.assign(EmptyUserAttributes(), options);

@Entity()
export default class User implements UserAttributes {
    @PrimaryGeneratedColumn()
    public id!: number;
    @Column()
    public first_name!: string;
    @Column()
    public last_name!: string;
    @Column()
    public email!: string;
    @Column()
    public original_phone!: string;
    @Column()
    public phone!: number;
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
    @Column()
    public birthday!: Date;
    @Column()
    public password!: string;
    @Column()
    public business_id!: number;
    @CreateDateColumn()
    public readonly created_on!: Date;
    @UpdateDateColumn()
    public readonly updated_on!: Date;
    @DeleteDateColumn()
    public readonly deleted_on!: Date;

    public constructor(options?: Partial<UserAttributes>) {
        const userAttr = UserBuilder(options);
        Object.assign(this, userAttr);
    }
}
