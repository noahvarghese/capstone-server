import axios from "axios";
import BaseWorld from "@test/support/base_world";
import { server } from "@util/permalink";
import { getCookie } from "@test/util/request";

export async function submitForm<T extends Record<string, unknown>>(
    this: BaseWorld,
    url: string,
    retrieveCookie: boolean,
    withCookie: boolean,
    errorOnFail = false
): Promise<void> {
    let cookie = "";
    let status: number | string = "";
    let message = "";

    const cookies = this.getCustomProp<string>("cookies");
    const body = this.getCustomProp<T>("body");

    try {
        const res = await axios.post(server(url), body, {
            headers: withCookie && cookies ? { Cookie: cookies } : {},
            withCredentials: true,
        });

        cookie = getCookie(res.headers);
        message = res.data.message;
        status = res.status;
    } catch (e) {
        const { response } = e;
        if (response) {
            status = response.status;
            message = response.data.message;
        }

        if (errorOnFail) {
            e.message = `${message}\n${e.message}`;
            throw e;
        }
    }

    if (retrieveCookie) this.setCustomProp<string | null>("cookies", cookie);

    this.setCustomProp<number>("status", status as number);
    this.setCustomProp<string>("message", message);
}
