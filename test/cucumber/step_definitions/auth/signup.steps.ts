import { Given, When } from "@cucumber/cucumber";
import { RegisterProps } from "../../../../src/routes/auth/signup";
import {
    businessAttributes,
    userAttributes,
} from "../../../sample_data/attributes";
import BaseWorld from "../../support/base_world";
import FormData from "form-data";
import { server } from "../../../../src/util/permalink";
import axios from "axios";
import { getCookie } from "../../../util/request";

const businessAttr = businessAttributes();
const userAttr = userAttributes();

Given("the user has valid inputs", function (this: BaseWorld) {
    this.setCustomProp<RegisterProps>("details", {
        name: businessAttr.name,
        address: businessAttr.address,
        city: businessAttr.city,
        postal_code: businessAttr.postal_code,
        province: businessAttr.province,
        first_name: userAttr.first_name,
        last_name: userAttr.last_name,
        password: userAttr.password,
        confirm_password: userAttr.password,
        email: userAttr.email,
        phone: userAttr.phone,
    });
});

When(
    "a new user registers a new business",
    { timeout: 10000 },
    async function (this: BaseWorld) {
        const registerProps = this.getCustomProp<RegisterProps>("details");

        const body = new FormData();

        for (const keyValuePair of Object.entries(registerProps)) {
            const key = keyValuePair[0];
            let val = keyValuePair[1];

            if (val instanceof Date) {
                val = val.toUTCString();
            }
            body.append(key, val);
        }

        let cookies: string | null = null;
        let message = "";
        let status: number;

        try {
            const res = await axios.post(server("auth/signup"), body, {
                headers: body.getHeaders(),
            });

            cookies = getCookie(res.headers);
            status = res.status;
            message = res.data.message;
        } catch (err) {
            const { response } = err;
            status = response.status;
        }

        this.setCustomProp<string>("message", message);
        this.setCustomProp<string | null>("cookies", cookies);
        this.setCustomProp<number>("status", status);
    }
);
