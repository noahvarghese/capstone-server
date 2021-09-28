import { uid } from "rand-token";
import bcrypt from "bcryptjs";
import { Entity, Column } from "typeorm";
import BaseModel from "../abstract/base_model";

export interface UserAttributes {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    token?: string | undefined | null;
    token_expiry?: Date | undefined | null;
}

const EmptyUserAttributes = (): UserAttributes => ({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    token: undefined,
    token_expiry: undefined,
});

const UserBuilder = <T extends Partial<UserAttributes>>(
    options?: T
): UserAttributes & T => Object.assign(EmptyUserAttributes(), options);

@Entity({ name: "user" })
export default class User extends BaseModel implements UserAttributes {
    public static max_password_length = 8;
    @Column()
    public first_name!: string;
    @Column()
    public last_name!: string;
    @Column()
    public email!: string;
    @Column()
    public phone!: string;
    @Column()
    public password!: string;
    @Column({ nullable: true, type: "text", unique: true })
    public token?: string | null | undefined;
    @Column({ nullable: true, type: "datetime", unique: false })
    public token_expiry?: Date | null | undefined;

    public constructor(options?: Partial<UserAttributes>) {
        super();
        const userAttr = UserBuilder(options);
        Object.assign(this, userAttr);
    }

    // pass reference back so we can chain it within the connection.manager.save method
    public createToken = (): User => {
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 4);

        this.token = uid(32);
        this.token_expiry = tokenExpiry;

        return this;
    };

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
    public hashPassword = async (_password: string): Promise<this> => {
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
    };

    public resetPassword = async (
        password: string,
        token: string
    ): Promise<boolean> => {
        if (this.compareToken(token)) {
            if (password.length >= User.max_password_length) {
                await this.hashPassword(password);
                this.token = null;
                this.token_expiry = null;
                return true;
            }
        }

        return false;
    };
}
