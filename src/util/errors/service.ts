export enum ServiceErrorReasons {
    UTILITY,
    DATABASE,
    RESOURCE_LOCKED,
    PERMISSIONS,
    PARAMETERS,
    NOT_AUTHENTICATED,
}

type ServiceErrorCodes = {
    [s in ServiceErrorReasons]: number;
};

const statusCode: ServiceErrorCodes = {
    [ServiceErrorReasons.DATABASE]: 500,
    [ServiceErrorReasons.UTILITY]: 500,
    [ServiceErrorReasons.PARAMETERS]: 400,
    [ServiceErrorReasons.NOT_AUTHENTICATED]: 401,
    [ServiceErrorReasons.PERMISSIONS]: 403,
    [ServiceErrorReasons.RESOURCE_LOCKED]: 405,
};

export const dataServiceResponse = (s: ServiceErrorReasons): number =>
    statusCode[s];

export default class DataServiceError extends Error {
    private _reason: ServiceErrorReasons;
    private _code!: number;
    set reason(val: ServiceErrorReasons) {
        this._reason = val;
        this.setCode();
    }
    get reason(): ServiceErrorReasons {
        return this._reason;
    }

    get code(): number {
        return this._code;
    }

    private _field?: string;
    get field(): string {
        return this._field ?? "";
    }

    constructor(reason: ServiceErrorReasons, message = "", field?: string) {
        super(message);
        this._reason = reason;
        this.setCode();
        this._field = field;
        // Keeping this commented out allows my properties to be processed????
        // Tests fail otherwise
        // Object.setPrototypeOf(this, Error.prototype);
    }

    private setCode() {
        this._code = dataServiceResponse(this.reason);
    }
}
