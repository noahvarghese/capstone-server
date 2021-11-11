import axios, { AxiosResponse } from "axios";
import BaseWorld from "@test/support/base_world";
import apiAttributes from "@test/sample_data/api/attributes";
import { getCookie } from "@test/util/request";
import { server } from "@util/permalink";

/**
 *
 * @param data can be anything
 * @returns an empty string if there is no data, other wise key value pair but all values have been 'stringified'
 */
const getQueryString = <T extends Record<string, unknown>>(data?: T) => {
    if (!data) return "";

    let queryString = "/?";
    for (const [key, value] of Object.entries(data ?? {})) {
        queryString += `${key}=${JSON.stringify(value)}&`;
    }
    queryString = queryString.substring(
        0,
        queryString.length - (queryString.length === 2 ? 2 : 1)
    );
    return queryString;
};

export default class Form {
    public static load<T>(
        this: BaseWorld,
        key: keyof typeof apiAttributes
    ): void {
        const attributes = apiAttributes[key]();
        this.setCustomProp<T>("body", attributes as T);
    }

    public static async submit<
        T extends Record<string, unknown>,
        X extends Record<string, unknown>
    >(
        this: BaseWorld,
        url: string,
        saveCookie: boolean,
        withCookie: boolean,
        errorOnFail = false,
        method: "delete" | "get" | "put" | "post" = "post",
        query?: X
    ): Promise<void> {
        let cookie = "";
        let status: number | string = "";
        let message = "";

        const cookies = this.getCustomProp<string>("cookies");
        const body = this.getCustomProp<T>("body");

        try {
            let res;
            const FQDN = server(url + getQueryString(query));

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
            message = res.data.message;
            status = res.status;
        } catch (_e) {
            const e = _e as Error & { response: AxiosResponse };
            const { response } = e;
            const seperator = "\n\t\t  ";
            console.error(
                "[ REQUEST ]:",
                method.toUpperCase(),
                server(url),
                seperator,
                e.message,
                seperator,
                response.data.message
            );

            if (response) {
                status = response.status;
                message = response.data.message;
            }

            if (errorOnFail && e instanceof Error) {
                e.message = `${message}\n${e.message}`;
                throw e;
            }
        }

        if (saveCookie) this.setCustomProp<string | null>("cookies", cookie);

        this.setCustomProp<number>("status", status as number);
        this.setCustomProp<string>("message", message);
    }
}
