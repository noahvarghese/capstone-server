import User from "../models/user/user";
import Event from "../models/event";
// import Logs from "./logs/logs";
import { client } from "./permalink";
import { getConnection } from "typeorm";
import Business from "@models/business";
import MembershipRequest from "@models/membership_request";
import Email from "email-templates";
import Model from "./model";
import Logs from "./logs/logs";

const TEMPLATE_DIR = `${__dirname}/emails`;

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
    const url = client("user/invite/" + membershipRequest.token);

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

export const requestResetPasswordEmail = async (): Promise<boolean> => {
    return Promise.resolve(true);
    // const resetPasswordUrl = client("auth/resetPassword/" + user.token);

    // return await sendMail(user, {
    //     subject: "Reset Password Requested",
    //     heading: `Reset password requested for user ${user.first_name} ${user.last_name}: ${user.email}`,
    //     body: `To reset your email please go to <a href="${resetPasswordUrl}">${resetPasswordUrl}</a></div><div>This link will expire at ${user.token_expiry}`,
    // });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// export const resetPasswordEmail = async (user?: User): Promise<boolean> => {
// return Promise.resolve(true);
// return await sendMail(user, {
//     subject: "Reset Password Requested",
//     heading: `Reset password successful for ${
//         user.first_name + " " + user.last_name
//     } : ${user.email}`,
//     body: `Your password has been reset, please contact support if this was not you.`,
// });
// };
