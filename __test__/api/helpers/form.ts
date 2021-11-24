import axios, { AxiosResponse } from "axios";
import BaseWorld from "@test/support/base_world";
import apiAttributes from "@test/api/attributes";
import { getCookie } from "@test/util/request";
import { server } from "@util/permalink";
import { outputStack } from "@util/logs/logs";

/**
 *
 * @param data can be anything
 * @returns an empty string if there is no data, other wise key value pair but all values have been 'stringified'
 */
const getQueryString = <T extends Record<string, unknown>>(data?: T) => {
    if (!data) return "";

    let queryString = "/?";
    for (const [key, value] of Object.entries(data ?? {})) {
        queryString += `${key}=${JSON.stringify(value).replace(/^"|"$/g, "")}&`;
    }
    queryString = queryString.substring(
        0,
        queryString.length - (queryString.length === 2 ? 2 : 1)
    );
    return queryString;
};

export default class Form {
    public static load<T>(
        baseWorld: BaseWorld,
        key: keyof typeof apiAttributes
    ): void {
        const attributes = apiAttributes[key]();
        baseWorld.setCustomProp<T>("body", attributes as T);
    }

    public static async submit<
        T extends Record<string, unknown>,
        X extends Record<string, unknown>
    >(
        baseWorld: BaseWorld,
        url: string,
        saveCookie: boolean,
        withCookie: boolean,
        errorOnFail = false,
        method: "delete" | "get" | "put" | "post" = "post",
        query?: X,
        param?: string
    ): Promise<void> {
        let cookie = "";
        let status: number | string = "";
        let message = "";
        let data = {};

        const cookies = baseWorld.getCustomProp<string>("cookies");
        const body = baseWorld.getCustomProp<T>("body");

        const FQDN = server(
            url + (param ? "/" + param : "") + getQueryString(query)
        );

        try {
            let res;

            if (["get", "delete"].includes(method) && body) {
                console.error(
                    "Body may not be sent with " +
                        method.toUpperCase() +
                        " requests",
                    body
                );
                throw new Error();
            }

            switch (method) {
                case "get":
                    res = await axios.get(FQDN, {
                        headers:
                            withCookie && cookies ? { Cookie: cookies } : {},
                        withCredentials: true,
                    });
                    break;
                case "post":
                    res = await axios.post(FQDN, body, {
                        headers:
                            withCookie && cookies ? { Cookie: cookies } : {},
                        withCredentials: true,
                    });
                    break;
                case "delete":
                    res = await axios.delete(FQDN, {
                        headers:
                            withCookie && cookies ? { Cookie: cookies } : {},
                        withCredentials: true,
                    });
                    break;
                case "put":
                    res = await axios.put(FQDN, body, {
                        headers:
                            withCookie && cookies ? { Cookie: cookies } : {},
                        withCredentials: true,
                    });
            }

            cookie = getCookie(res.headers);
            data = res.data;
            message = res.data.message;
            status = res.status;
        } catch (_e) {
            const e = _e as Error & { response: AxiosResponse };
            const { response } = e;
            const seperator = "\n\t\t  ";
            console.log(
                "[ REQUEST ]:",
                method.toUpperCase(),
                FQDN,
                seperator,
                e.message,
                seperator,
                response?.data.message ?? undefined,
                outputStack(2)
            );

            if (response) {
                status = response.status;
                data = response.data;
                message = response.data.message;
            }

            if (errorOnFail && e instanceof Error) {
                e.message = `${message}\n${e.message}`;
                throw e;
            }
        }

        if (saveCookie)
            baseWorld.setCustomProp<string | null>("cookies", cookie);

        baseWorld.setCustomProp("responseData", data);
        baseWorld.setCustomProp<number>("status", status as number);
        baseWorld.setCustomProp<string>("message", message);
    }
}
