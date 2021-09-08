import fetch from "node-fetch";
import Logs from "../../src/util/logs/logs";

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

export const getRedirectInfo = async (url: string): Promise<{ status: number; location: string }> => {
    return await new Promise<{ status: number; location: string; }>((res) => {
        fetch(url, { redirect: "manual" })
            .then(async (response) => {
                const returnVal: { status: number; location: string } = {status: -1, location: ""};

                returnVal.status = response.status;
                returnVal.location = Array.from(response.headers.entries()).find(([key]) => key === "location")?.[1] ?? "";
                res(returnVal);
            }).catch((err) => {
                Logs.Test(err);
                res(err);
            });
    });
}
