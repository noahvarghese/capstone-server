export default class ModelError extends Error {
    public deleted?: boolean;

    constructor(message?: string, _deleted?: boolean) {
        super(message);
        this.deleted = _deleted;
    }
}
