import urls from "@test/api/urls";
import ApiTest from "@test/api";
import BaseWorld from "@test/support/base_world";
import Form from "../helpers/form";

import * as business from "./business";
import * as members from "./members";
import * as auth from "./auth";
import * as password from "./password";
import * as roles from "./roles";
import * as departments from "./departments";
import * as settings from "./settings";

export type ApiTestAction = {
    [i in ApiTest]: (
        baseWorld: BaseWorld,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...args: any[]
    ) => Promise<void>;
};

export async function apiRequest(
    this: BaseWorld,
    key: ApiTest,
    opts?: {
        cookie?: {
            withCookie: boolean;
            saveCookie: boolean;
        };
        token?: string | null;
        body?: Record<string, unknown>;
        param?: string;
        query?: Record<string, unknown>;
        errorOnFail?: boolean;
        method?: "get" | "post" | "put" | "delete";
    }
): Promise<void> {
    if (!opts?.body) Form.load.call(this, key);
    else this.setCustomProp<typeof opts.body>("body", opts.body);

    await Form.submit.call(
        this,
        typeof urls[key] === "function"
            ? (urls[key] as (token: string) => string)(opts?.token ?? "")
            : (urls[key] as string),
        Boolean(opts?.cookie?.saveCookie),
        Boolean(opts?.cookie?.withCookie),
        opts?.errorOnFail,
        opts?.method,
        opts?.query,
        opts?.param
    );
}

const actions: ApiTestAction = {
    ...business,
    ...members,
    ...auth,
    ...password,
    ...roles,
    ...departments,
    ...settings,
};

export default actions;
