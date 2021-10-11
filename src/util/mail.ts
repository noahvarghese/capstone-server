import User from "@models/user/user";
import Event from "@models/event";
import { client } from "./permalink";
import { getConnection } from "typeorm";
import Business from "@models/business";
import MembershipRequest from "@models/membership_request";
import Email from "email-templates";
import Model from "./model";
import Logs from "./logs/logs";

const { NODE_ENV } = process.env;
const TEMPLATE_DIR = NODE_ENV === "dev" || NODE_ENV === "test" ? `${__dirname}/../../email_templates` : `${__dirname}/../email_templates`;

const email = new Email({
    message: {
        from: process.env.MAIL_USER ?? "noreply@onboard.com",
    },
    views: { root: TEMPLATE_DIR },
    send: true,
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
    business: Business,
    membershipRequest: MembershipRequest,
    sendingUser: User,
    receivingUser: User
): Promise<boolean> => {
    const url = client(`user/invite/${membershipRequest.token}`);

    return await sendMail(
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

export const requestResetPasswordEmail = async (
    user: User
): Promise<boolean> => {
    const url = client(`resetPassword/${user.token}`);
    return await sendMail(
        {
            template: "request_reset_password",
            message: { to: user.email },
            locals: { url, first_name: user.first_name },
        },
        new Event({
            name: "Request Reset Password",
            user_id: user.id,
        })
    );
};

export const resetPasswordEmail = async (user: User): Promise<boolean> => {
    return await sendMail(
        {
            template: "reset_password",
            message: { to: user.email },
            locals: { first_name: user.first_name },
        },
        new Event({ name: "Password Reset", user_id: user.id })
    );
};

export const sendMail = async (
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

    await Model.create<Event>(getConnection(), Event, event);
    return event.status === "PASS";
};
