import Business from "@models/business";
import Membership from "@models/membership";
import User from "@models/user/user";
import { apiRequest } from "@test/helpers/api/actions";
import attributes from "@test/sample_data/api/attributes";
import BaseWorld from "@test/support/base_world";

// to be merged with helpers actions at some point
export async function loginUser(this: BaseWorld): Promise<void> {
    const email = "automailr.noreply@gmail.com";
    const { password } = attributes.login();
    const { first_name, last_name } = attributes.inviteUser();

    const connection = this.getConnection();
    const user = await new User({ email, first_name, last_name }).hashPassword(
        password
    );

    const res = await connection.manager.insert(User, user);

    const business = await connection
        .createQueryBuilder()
        .select("b")
        .from(Business, "b")
        .where("b.name = :name", {
            name: this.getCustomProp<string[]>("businessNames")[0],
        })
        .getOne();

    await connection.manager.insert(
        Membership,
        new Membership({
            business_id: business?.id,
            user_id: res.identifiers[0].id,
            default: true,
        })
    );

    // create new user in database with relationships
    //login

    await apiRequest.call(this, "login", {
        cookie: {
            withCookie: false,
            saveCookie: true,
        },
        body: { email, password },
    });
}
