import nodemailer from "nodemailer";
import DBConnection from "../../test/util/db_connection";
import User from "../models/user/user";
import Event from "../models/event";
import Logs from "./logs/logs";
import Business from "../models/business";

export interface MailOpts {
    to?: string;
    subject: string;
    html: string;
}

export const sendMail = async (
    model: User | Business,
    mailOpts: MailOpts
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
                const connection = await DBConnection.GetConnection();

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
