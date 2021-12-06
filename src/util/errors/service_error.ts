export enum ServiceErrorReasons {
    DATABASE = 500,
    SERVER = 500,
    PARAMS = 400,
    AUTH = 401,
}

export default class ServiceError extends Error {
    private _reason: ServiceErrorReasons;
    get reason(): 500 | 401 | 400 {
        return this._reason;
    }

    private _field?: string;
    get field(): string {
        return this._field ?? "";
    }

    constructor(message: string, reason: ServiceErrorReasons, field?: string) {
        super(message);
        this._reason = reason;
        this._field = field;
        Object.setPrototypeOf(this, ServiceError.prototype);
    }
}
