import urls from "@test/api/urls";
import ApiTest from "@test/api";
import BaseWorld from "@test/support/base_world";
import Form from "../helpers/form";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiTestFn {
    (this: ApiTestFn, baseWorld: BaseWorld, ...args: unknown[]): Promise<void>;
    name: ApiTest;
}
export type ApiTestAction = {
    [i in ApiTest]: (
        baseWorld: BaseWorld,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...args: any[]
    ) => Promise<void>;
};

export async function apiRequest(
    baseWorld: BaseWorld,
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
    if (!opts?.body) Form.load(baseWorld, key);
    else baseWorld.setCustomProp<typeof opts.body>("body", opts.body);

    await Form.submit(
        baseWorld,
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
