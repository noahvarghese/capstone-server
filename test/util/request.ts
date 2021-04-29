import fetch from "node-fetch";
import Logs from "../../src/util/logs/logs";

export const getResponseStatus = async (url: string): Promise<number> => {
    return await new Promise<number>((res) => {
        fetch(url, { redirect: "manual" })
            .then((response) => {
                res(response.status);
            })
            .catch((err) => {
                Logs.Test(err);
                res(-1);
            });
    });
};
