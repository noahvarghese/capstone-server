import { Given, Then, When } from "@cucumber/cucumber";
import { RegisterProps } from "../../../../src/routes/auth/signup";
import {
    businessAttributes,
    userAttributes,
} from "../../../sample_data/attributes";
import BaseWorld from "../../support/base_world";
import fetch from "node-fetch";
import FormData from "form-data";
import { server } from "../../../../src/util/permalink";
import { Connection } from "typeorm";
import User from "../../../../src/models/user/user";
import Business from "../../../../src/models/business";
import Event from "../../../../src/models/event";
import { expect } from "chai";

Given("the user has valid inputs", function (this: BaseWorld) {
    this.setCustomProp<RegisterProps>("details", {
        address: userAttributes.address,
        birthday: userAttributes.birthday ?? new Date(),
        business_address: businessAttributes.address,
        business_city: businessAttributes.city,
        business_code: businessAttributes.code,
        business_email: businessAttributes.email,
        business_name: businessAttributes.name,
        business_phone: businessAttributes.phone,
        business_postal_code: businessAttributes.postal_code,
        business_province: businessAttributes.province,
        city: userAttributes.city,
        confirm_password: userAttributes.password,
        email: userAttributes.email,
        first_name: userAttributes.first_name,
        last_name: userAttributes.last_name,
        password: userAttributes.password,
        phone: userAttributes.phone,
        postal_code: userAttributes.postal_code,
        province: userAttributes.province,
    });
});

When(
    "a new user is registered for an existing business",
    { timeout: 10000 },
    async function (this: BaseWorld) {
        const registerProps = this.getCustomProp<RegisterProps>("details");

        const body = new FormData();

        for (const keyValuePair of Object.entries(registerProps)) {
            const key = keyValuePair[0];
            let val = keyValuePair[1];

            if (key === "business_code" || !key.includes("business")) {
                if (val instanceof Date) {
                    val = val.toUTCString();
                }

                body.append(key, val);
            }
        }

        const res = await fetch(server + "auth/signup", {
            method: "POST",
            body,
        });

        const cookies = res.headers.get("set-cookie");

        try {
            this.setCustomProp<string>(
                "message",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ((await res.json()) as any).message
            );
        } catch (_) {
            this.setCustomProp<string>("message", "");
        }

        this.setCustomProp<string | null>("cookies", cookies);
        this.setCustomProp<number>("status", res.status);
    }
);

When(
    "a new user registers a new business",
    { timeout: 10000 },
    async function (this: BaseWorld) {
        const registerProps = this.getCustomProp<RegisterProps>("details");

        const body = new FormData();

        for (const keyValuePair of Object.entries(registerProps)) {
            const key = keyValuePair[0];
            let val = keyValuePair[1];

            if (key !== "business_code") {
                if (val instanceof Date) {
                    val = val.toUTCString();
                }
                body.append(key, val);
            }
        }

        const res = await fetch(server + "auth/signup", {
            method: "POST",
            body,
        });

        const cookies = res.headers.get("set-cookie");

        try {
            this.setCustomProp<string>(
                "message",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ((await res.json()) as any).message
            );
        } catch (_) {
            this.setCustomProp<string>("message", "");
        }

        this.setCustomProp<string | null>("cookies", cookies);
        this.setCustomProp<number>("status", res.status);
    }
);

Then(
    "the {string} should get a welcome email",
    async function (this: BaseWorld, modelName: "business" | "user") {
        const connection = this.getCustomProp<Connection>("connection");

        let model: User | Business;

        if (modelName === "user") {
            model = this.getCustomProp<User>("user");

            if (!model) {
                model = await connection.manager.findOneOrFail(User, {
                    where: { email: userAttributes.email },
                });
            }
        } else {
            model = this.getCustomProp<Business>("business");

            if (!model) {
                model = await connection.manager.findOneOrFail(Business, {
                    where: { code: businessAttributes.code },
                });
            }
        }

        const event = await connection.manager.findOneOrFail(Event, {
            where: {
                [modelName === "user" ? "user_id" : "business_id"]: model.id,
            },
        });

        expect(event.name).to.include("Welcome Onboard");
    }
);

Then(
    "the business should be notified by email",
    async function (this: BaseWorld) {
        return "pending";
    }
);
