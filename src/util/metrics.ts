import Logs, { LogLevels } from "./logs";

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
    Logs.addLog(
        `Function ${functionName ? `${functionName} ` : ""} runtime: ${
            metrics.end - metrics.start
        } milliseconds.`,
        LogLevels.METRICS
    );
    return result;
};
