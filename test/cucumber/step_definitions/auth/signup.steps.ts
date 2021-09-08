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

Given("the user has valid inputs", function (this: BaseWorld) {
    this.setCustomProp<RegisterProps>("details", {
        address: userAttributes.address,
        birthday: userAttributes.birthday?.toDateString() ?? "",
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
    async function (this: BaseWorld) {
        const registerProps = this.getCustomProp<RegisterProps>("details");

        const body = new FormData();

        for (const [key, val] of Object.entries(registerProps)) {
            if (key === "business_code" || !key.includes("business")) {
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

When("a new user registers a new business", async function (this: BaseWorld) {
    const registerProps = this.getCustomProp<RegisterProps>("details");

    const body = new FormData();

    for (const [key, val] of Object.entries(registerProps)) {
        if (key !== "business_code") {
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
});

Then(
    "the {string} should get a welcome email",
    async function (this: BaseWorld, modelName: "business" | "user") {
        console.log(modelName);

        const connection = this.getCustomProp<Connection>("connection");

        let model: User | Business;

        if (modelName === "user") {
            model = await connection.manager.findO;
        } else {
        }
        return "pending";
    }
);

Then(
    "the business should be notified by email",
    async function (this: BaseWorld) {
        return "pending";
    }
);
