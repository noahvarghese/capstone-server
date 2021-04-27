// tslint:disable: no-console
import dotenv from "dotenv";
dotenv.config();

enum LogLevels {
    EVENT = 0,
    ERROR = 1,
    WARN = 2,
    DEBUG = 3,
    LOG = 4,
    METRICS = 5,
    SQL = 6,
}

interface LogData {
    prefix: string;
    consoleFunction: (
        prefix: string,
        message: string | unknown,
        ...optionalParams: unknown[]
    ) => void;
}

const emptyLogData = (): LogData => ({
    prefix: "",
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    consoleFunction: (): void => {},
});

const createLogData = <T extends Partial<LogData>>(
    intialValues: T
): LogData & T => {
    return Object.assign(emptyLogData(), intialValues);
};

export default class Logs {
    static logLevel: LogLevels = Number(process.env.LOG_LEVEL) ?? Infinity;

    private static getLogData = (logLevel: LogLevels): LogData => {
        switch (logLevel) {
            case LogLevels.EVENT:
                return createLogData({
                    prefix: "[ EVENT ]: ",
                    consoleFunction: console.log,
                });
            case LogLevels.ERROR:
                return createLogData({
                    prefix: "[ ERROR ]: ",
                    consoleFunction: console.error,
                });
            case LogLevels.WARN:
                return createLogData({
                    prefix: "[ WARNING ]: ",
                    consoleFunction: console.warn,
                });
            case LogLevels.DEBUG:
                return createLogData({
                    prefix: "[ DEBUG ]: ",
                    consoleFunction: console.debug,
                });
            case LogLevels.LOG:
                return createLogData({
                    prefix: "[ LOG ]: ",
                    consoleFunction: console.log,
                });
            case LogLevels.SQL:
                return createLogData({
                    prefix: "[ SQL ]: ",
                    consoleFunction: console.info,
                });
            case LogLevels.METRICS:
                return createLogData({
                    prefix: "[ METRICS ]: ",
                    consoleFunction: console.info,
                });
            default:
                throw new Error(
                    "Log level passed in does match log levels set."
                );
        }
    };

    private static add = (
        logLevel: LogLevels,
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        if (logLevel <= Logs.logLevel) {
            try {
                const { prefix, consoleFunction }: LogData = Logs.getLogData(
                    logLevel
                );

                consoleFunction(
                    prefix,
                    typeof message !== "string"
                        ? JSON.stringify(message)
                        : message,
                    ...optionalParams
                );
            } catch (e) {
                console.error(e.message);
            }
        }
    };

    static Event = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(LogLevels.EVENT, message, optionalParams);
    };

    static Error = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(LogLevels.ERROR, message, optionalParams);
    };

    static Warning = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(LogLevels.WARN, message, optionalParams);
    };

    static Debug = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(LogLevels.DEBUG, message, optionalParams);
    };

    static Log = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(LogLevels.LOG, message, optionalParams);
    };

    static SQL = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(LogLevels.SQL, message, optionalParams);
    };

    static Metric = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(LogLevels.METRICS, message, optionalParams);
    };
}
