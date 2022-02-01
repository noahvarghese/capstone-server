import bcrypt from "bcryptjs";
import { Entity, Column } from "typeorm";
import BaseModel, { AttributeFactory } from "@models/abstract/base_model";
import validator from "validator";

export interface UserAttributes {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    birthday: Date | undefined;
    password: string;
    token?: string | undefined | null;
    token_expiry?: Date | undefined | null;
}

export const EmptyUserAttributes = (): UserAttributes => ({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    birthday: undefined,
    password: "",
    token: undefined,
    token_expiry: undefined,
});

@Entity({ name: "user" })
export default class User extends BaseModel implements UserAttributes {
    @Column()
    public first_name!: string;
    @Column()
    public last_name!: string;
    @Column()
    public email!: string;
    @Column({ nullable: true })
    public phone!: string;
    @Column()
    public birthday!: Date;
    @Column()
    public password!: string;
    @Column({ nullable: true, type: "text", unique: true })
    public token?: string | null | undefined;
    @Column({ nullable: true, type: "datetime", unique: false })
    public token_expiry?: Date | null | undefined;

    public constructor(options?: Partial<UserAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyUserAttributes));
    }

    public compareToken = (_token: string): boolean => {
        if (
            this.token_expiry &&
            this.token_expiry.getTime() > new Date().getTime()
        ) {
            return this.token === _token;
        }
        return false;
    };

    public comparePassword = async (_password: string): Promise<boolean> => {
        return await new Promise((res, rej) => {
            bcrypt.compare(_password, this.password, (err, same) => {
                if (err) {
                    rej(err);
                }
                res(same);
            });
        });
    };

    // pass reference back so we can chain it within the connection.manager.save method
    public async hashPassword(this: User, _password: string): Promise<User> {
        const hash = await new Promise<string>((res, rej) => {
            bcrypt.hash(_password, 12, (err, hash) => {
                if (err) {
                    rej(err);
                }

                res(hash);
            });
        });

        this.password = hash;
        return this;
    }

    public resetPassword = async (password: string): Promise<void> => {
        if (validator.isEmpty(password, { ignore_whitespace: true }))
            throw new Error("Password cannot be empty");
        await this.hashPassword(password);
        this.token = null;
        this.token_expiry = null;
    };
}
