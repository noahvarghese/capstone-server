import axios from "axios";
import BaseWorld from "@test/cucumber/support/base_world";
import { server } from "@util/permalink";
import { getCookie } from "@test/util/request";

export async function submitForm<T extends Record<string, unknown>>(
    this: BaseWorld,
    url: string,
    retrieveCookie: boolean,
    withCookie: boolean
): Promise<void> {
    let cookie = "";
    let status: number;
    let message = "";

    const cookies = this.getCustomProp<string>("cookies");
    const body = this.getCustomProp<T>("body");

    try {
        const res = await axios.post(server(url), body, {
            headers: withCookie ? { Cookie: cookies } : {},
            withCredentials: true,
        });

        cookie = getCookie(res.headers);
        message = res.data.message;
        status = res.status;
    } catch (e) {
        const { response } = e;
        status = response.status;
        message = response.data.message;
    }

    if (retrieveCookie) this.setCustomProp<string | null>("cookies", cookie);

    this.setCustomProp<number>("status", status);
    this.setCustomProp<string>("message", message);
}
