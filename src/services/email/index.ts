import Email from "email-templates";
import User from "@models/user/user";
import Event from "@models/event";
import Business from "@models/business";
import { client } from "@util/permalink";
import { Connection } from "typeorm";
import MembershipRequest from "@models/membership_request";
import Logs from "@noahvarghese/logger";

const TEMPLATE_DIR = `${__dirname}/templates`;

const email = new Email({
    message: {
        from: process.env.MAIL_USER ?? "",
    },
    views: { root: TEMPLATE_DIR },
    send: process.env.NODE_ENV !== "test",
    // causes errors due to cherrio
    juice: false,
    transport: {
        service: "gmail",
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PWD,
        },
    },
});

export interface MailOpts {
    to?: string;
    subject: string;
    heading?: string;
    body: string;
}

// const doNotReply =
// '<div><sub><em>Please do not reply to this email. It will not reach the intended recipient. If there are any issues please email <a href="mailto:varghese.noah@gmail.com">Noah Varghese</a></em></sub></div>';

export const sendUserInviteEmail = async (
    connection: Connection,
    business_id: number,
    user_id: number,
    new_user_id: number
): Promise<boolean> => {
    const [
        { name: businessName },
        { first_name: sendingUserName },
        { first_name: newUserName, email: newUserEmail },
        { token },
    ] = await Promise.all([
        connection.manager.findOneOrFail(Business, business_id),
        connection.manager.findOneOrFail(User, user_id),
        connection.manager.findOneOrFail(User, new_user_id),
        connection.manager.findOneOrFail(MembershipRequest, {
            where: { user_id: new_user_id, business_id },
        }),
    ]);

    const url = client(`member/invite/${token}`);

    return await sendMail(
        {
            template: "invite_user",
            message: { to: newUserEmail },
            locals: {
                business: businessName,
                receiver: newUserName,
                sender: sendingUserName,
                url,
            },
        },
        connection,
        new Event({
            name: "User Invite Email",
            business_id: business_id,
            user_id: new_user_id,
        })
    );
};

export const requestResetPasswordEmail = async (
    connection: Connection,
    user: User
): Promise<boolean> => {
    const url = client(`resetPassword/${user.token}`);
    return await sendMail(
        {
            template: "request_reset_password",
            message: { to: user.email },
            locals: { url, first_name: user.first_name },
        },
        connection,
        new Event({
            name: "Request Reset Password",
            user_id: user.id,
        })
    );
};

export const resetPasswordEmail = async (
    connection: Connection,
    user: User
): Promise<boolean> => {
    return await sendMail(
        {
            template: "reset_password",
            message: { to: user.email },
            locals: { first_name: user.first_name },
        },
        connection,
        new Event({ name: "Password Reset", user_id: user.id })
    );
};

export const sendMail = async (
    options: Email.EmailOptions,
    connection: Connection,
    event: Event
): Promise<boolean> => {
    try {
        await email.send(options);
        event.status = "PASS";
    } catch (e) {
        Logs.Error(e);
        event.status = "FAIL";
        event.reason = JSON.stringify(e);
    }

    await connection.manager.insert(Event, event);
    return event.status === "PASS";
};
