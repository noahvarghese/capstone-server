import { ApiRoute, urls } from "@test/sample_data/api/dependencies";
import BaseWorld from "@test/cucumber/support/base_world";
import { loadBody } from "../setup";
import { submitForm } from "../submit_form";

export type ActionFnMap = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [i in ApiRoute]: (this: BaseWorld, ...args: any[]) => Promise<void>;
};

async function loadAndCall(
    this: BaseWorld,
    key: ApiRoute,
    cookieOpts?: {
        withCookie: boolean;
        saveCookie: boolean;
        errOnFail?: boolean;
    },
    token?: string,
    body?: unknown
): Promise<void> {
    if (!body) loadBody.call(this, key);
    else this.setCustomProp<typeof body>("body", body);

    await submitForm.call(
        this,
        typeof urls[key] === "function"
            ? (urls[key] as (token: string) => string)(token ?? "")
            : (urls[key] as string),
        Boolean(cookieOpts?.saveCookie),
        Boolean(cookieOpts?.withCookie),
        cookieOpts?.errOnFail
    );
}

export default loadAndCall;
