import Logs from "@noahvarghese/logger";
import axios, { AxiosResponse } from "axios";

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
): Promise<{ status: number; location: string }> => {
    return await new Promise<{ status: number; location: string }>((res) => {
        const returnVal: { status: number; location: string } = {
            status: -1,
            location: "",
        };

        axios
            .get(url, { maxRedirects: 0 })
            .then((response) => {
                returnVal.status = response.status;
                returnVal.location = response.request.res.responseUrl;
                res(returnVal);
            })
            .catch((_e) => {
                const e: Error & { response: AxiosResponse } = _e as Error & {
                    response: AxiosResponse;
                };

                for (const [key, val] of Object.entries(e.response.headers)) {
                    if (key === "location") {
                        returnVal.location = val as string;
                        break;
                    }
                }
                returnVal.status = e.response.status;
                res(returnVal);
            });
    });
};
