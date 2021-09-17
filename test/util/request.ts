import axios from "axios";
import Logs from "../../src/util/logs/logs";

export const getCookie = (headers: { [name: string]: string }): string => {
    for (const [key, value] of Object.entries(headers)) {
        if (key === "set-cookie") {
            return value;
        }
    }

    return "";
};

export const getResponseStatus = async (url: string): Promise<number> => {
    return await new Promise<number>((res) => {
        fetch(url, { redirect: "manual" })
            .then(async (response) => {
                res(response.status);
            })
            .catch((err) => {
                Logs.Test(err);
                res(-1);
            });
    });
};

export const getRedirectInfo = async (
    url: string
): Promise<{ status: number; location: string }> =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise<{ status: number; location: string }>(async (res) => {
        const returnVal: { status: number; location: string } = {
            status: -1,
            location: "",
        };

        try {
            const response = await axios.get(url, { maxRedirects: 0 });

            returnVal.status = response.status;
            returnVal.location = response.request.res.responseUrl;
        } catch (err) {
            for (const [key, val] of Object.entries(err.response.headers)) {
                if (key === "location") {
                    returnVal.location = val as string;
                    break;
                }
            }
            returnVal.status = err.response.status;
        }

        res(returnVal);
    });
