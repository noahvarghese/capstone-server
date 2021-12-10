import { Connection } from "typeorm";
import Email from "email-templates";
import User from "@models/user/user";
import Event from "@models/event";
import Business from "@models/business";
import Logs from "@util/logs/logs";
import { client } from "@util/permalink";

const TEMPLATE_DIR = `${__dirname}/templates`;

const email = new Email({
    message: {
        from: process.env.MAIL_USER ?? "noreply@onboard.com",
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
    business: Business,
    token: string,
    sendingUser: User,
    receivingUser: User
): Promise<boolean> => {
    const url = client(`member/invite/${token}`);

    return await sendMail(
        connection,
        {
            template: "invite_user",
            message: { to: receivingUser.email },
            locals: {
                business: business.name,
                receiver: receivingUser.first_name,
                sender: sendingUser.first_name,
                url,
            },
        },
        new Event({
            name: "User Invite Email",
            business_id: business.id,
            user_id: receivingUser.id,
        })
    );
};

export const forgotPasswordEmail = async (
    connection: Connection,
    user: User
): Promise<boolean> => {
    const url = client(`resetPassword/${user.token}`);
    return await sendMail(
        connection,
        {
            template: "forgot_password",
            message: { to: user.email },
            locals: { url, first_name: user.first_name },
        },
        new Event({
            name: "Forgot Password",
            user_id: user.id,
        })
    );
};

export const resetPasswordEmail = async (
    connection: Connection,
    user: User
): Promise<boolean> => {
    return await sendMail(
        connection,
        {
            template: "reset_password",
            message: { to: user.email },
            locals: { first_name: user.first_name },
        },
        new Event({ name: "Password Reset", user_id: user.id })
    );
};

export const sendMail = async (
    connection: Connection,
    options: Email.EmailOptions,
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
