import axios, { AxiosResponse } from "axios";
import BaseWorld from "@test/support/base_world";
import apiAttributes from "@test/sample_data/api/attributes";
import { getCookie } from "@test/util/request";
import { server } from "@util/permalink";

export default class Form {
    public static load<T>(
        this: BaseWorld,
        key: keyof typeof apiAttributes
    ): void {
        const attributes = apiAttributes[key]();
        this.setCustomProp<T>("body", attributes as T);
    }

    public static async submit<T extends Record<string, unknown>>(
        this: BaseWorld,
        url: string,
        saveCookie: boolean,
        withCookie: boolean,
        errorOnFail = false,
        method: "delete" | "put" | "post" = "post"
    ): Promise<void> {
        let cookie = "";
        let status: number | string = "";
        let message = "";

        const cookies = this.getCustomProp<string>("cookies");
        const body = this.getCustomProp<T>("body");

        try {
            let res;
            switch (method) {
                case "post":
                    res = await axios.post(server(url), body, {
                        headers:
                            withCookie && cookies ? { Cookie: cookies } : {},
                        withCredentials: true,
                    });
                    break;
                case "delete":
                    // eslint-disable-next-line no-case-declarations
                    let queryString = "/?";
                    for (const [key, value] of Object.entries(body)) {
                        queryString += `${key}=${JSON.stringify(value)}&`;
                    }
                    queryString = queryString.substring(
                        0,
                        queryString.length - 1
                    );

                    res = await axios.delete(server(url + queryString), {
                        headers:
                            withCookie && cookies ? { Cookie: cookies } : {},
                        withCredentials: true,
                    });
                    break;
                case "put":
                    res = await axios.put(server(url), {
                        headers:
                            withCookie && cookies ? { Cookie: cookies } : {},
                        withCredentials: true,
                        data: body,
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
