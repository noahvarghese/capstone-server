import nodemailer from "nodemailer";
import User from "../models/user/user";
import Event from "../models/event";
import Logs from "./logs/logs";
import Business from "../models/business";
import { client } from "./permalink";
import { Connection } from "typeorm";

export interface MailOpts {
    to?: string;
    subject: string;
    html: string;
}

export const requestResetPasswordEmail = async (
    user: User,
    connection: Connection
): Promise<boolean> => {
    const resetPasswordUrl = client + "auth/resetPassword/" + user.token;

    return await sendMail(user, {
        subject: "Reset Password Requested",
        html: `<div><h1>Reset password requested for user ${
            user.first_name + " " + user.last_name
        } : ${
            user.email
        }</h1><div>To reset your email please go to <a href="${resetPasswordUrl}">${resetPasswordUrl}</a></div><div>This link will expire at ${
            user.token_expiry
        }</div><div><sub><em>Please do not reply to this email. It will not reach the intended recipient. If there are any issues please email <a href="mailto:varghese.noah@gmail.com">Noah Varghese</a></em></sub></div></div>`,
    },connection);
};

export const resetPasswordEmail = async (user: User, connection: Connection): Promise<boolean> => {
    return await sendMail(user, {
        subject: "Reset Password Requested",
        html: `<div><h1>Reset password successful for ${
            user.first_name + " " + user.last_name
        } : ${
            user.email
        }</h1><div>Your password has been reset, please contact support if this was not you.</div><div><sub><em>Please do not reply to this email. It will not reach the intended recipient. If there are any issues please email <a href="mailto:varghese.noah@gmail.com">Noah Varghese</a></em></sub></div></div>`,
    }, connection);
};

export const sendMail = async (
    model: User | Business,
    mailOpts: MailOpts,
    connection: Connection
): Promise<boolean> => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PWD,
        },
    });

    return new Promise((res, rej) => {
        transporter.sendMail(
            {
                ...mailOpts,
                text: "",
                to: mailOpts.to ?? model.email,
                from: process.env.MAIL_USER,
            },
            async (err, info) => {
                // const connection = await DBConnection.GetConnection();

                const event = connection.manager.create(Event, {
                    name: mailOpts.subject,
                    status: err ? "FAIL" : "PASS",
                    [model instanceof User ? "user_id" : "business_id"]:
                        model.id,
                });

                await connection.manager.save<Event>(event);

                if (info) {
                    Logs.Event(info);
                }

                if (err) {
                    Logs.Error(err);
                    rej(false);
                } else {
                    res(true);
                }
            }
        );
    });
};
