import { Given, When, Then } from "@cucumber/cucumber";
import User from "@models/user/user";
import BaseWorld from "@test/cucumber/support/base_world";
import { expect } from "chai";
import attributes, {
    RequestResetPasswordProps,
    ResetPasswordProps,
} from "@test/sample_data/api/attributes";
import loadAndCall from "@test/cucumber/helpers/actions";
import { Connection } from "typeorm";
import { submitForm } from "@test/cucumber/helpers/submit_form";
import { urls } from "@test/sample_data/api/dependencies";
import { loadBody } from "@test/cucumber/helpers/setup";

const { email } =
    attributes.requestResetPassword() as RequestResetPasswordProps;
const { password } = attributes.resetPassword() as ResetPasswordProps;

const getUser = async (connection: Connection) =>
    (
        await connection.manager.find(User, {
            where: {
                email,
            },
        })
    )[0];

Given(
    "I have requested to reset the password",
    async function (this: BaseWorld) {
        await loadAndCall.call(this, "requestResetPassword", {
            withCookie: false,
            saveCookie: false,
        });
    }
);

Given("I have an invalid token", function (this: BaseWorld) {
    this.setCustomProp<string>("invalid_token", "invalid_token");
});

Given("the passwords do not match", function (this: BaseWorld) {
    this.setCustomProp<string>("invalid_password", "invalid_password");
});

When(
    "I reset the password",
    { timeout: 10000 },
    async function (this: BaseWorld) {
        loadBody.call(this, "resetPassword");

        const invalid_token = this.getCustomProp<string | undefined>(
            "invalid_token"
        );

        const invalid_password = this.getCustomProp<string | undefined>(
            "invalid_password"
        );

        const connection = this.getConnection();
        const { token } = await getUser(connection);

        const url = (urls.resetPassword as (t: string) => string)(
            invalid_token ?? token ?? ""
        );

        if (invalid_password) {
            this.setCustomProp<ResetPasswordProps>("body", {
                ...this.getCustomProp<ResetPasswordProps>("body"),
                confirm_password: invalid_password,
            });
        }

        await submitForm.call(this, url, true, false);
        console.log(this.getCustomProp<string>("message"));
    }
);

Then("the password is reset", async function (this: BaseWorld) {
    const connection = this.getConnection();
    const user = await getUser(connection);
    expect(await user.comparePassword(password)).to.be.true;
});

Then("the token is cleared", async function (this: BaseWorld) {
    const connection = this.getConnection();
    const user = await getUser(connection);
    expect(user.token).to.be.null;
});

Then("the token expiry is cleared", async function (this: BaseWorld) {
    const connection = this.getConnection();
    const user = await getUser(connection);
    expect(user.token_expiry).to.be.null;
});

Then("the password is not reset", async function (this: BaseWorld) {
    const connection = this.getConnection();
    const user = await getUser(connection);
    expect(await user.comparePassword(password)).to.be.false;
});
