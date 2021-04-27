import Logs from "./logs/logs";

interface Metrics {
    start: number;
    end: number | undefined;
}

const newMetrics = (): Metrics => ({
    start: new Date().getTime(),
    end: undefined,
});

export const timedFunc = (
    func: <T1>(...params: T1[]) => Promise<T1>,
    functionName?: string
) => async <T2>(...params: T2[]): Promise<T2> => {
    const metrics = newMetrics();
    const result = await func(...params);
    metrics.end = new Date().getTime();
    Logs.Metric(
        `Function ${functionName ? `${functionName} ` : ""} runtime: ${
            metrics.end - metrics.start
        } milliseconds.`
    );
    return result;
};
