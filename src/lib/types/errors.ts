/** Represents Runtime error that is thrown while CLI program is running */
export class RuntimeError extends Error {
    public dateTime: Date
    constructor(...params: any) {
        super(params)

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RuntimeError)
        }

        this.name = 'RuntimeError'
        this.dateTime = new Date()
    }
}

/** Represents Configuration error that is thrown during program configuration */
export class ConfigurationError extends Error {
    public dateTime: Date
    constructor(...params: any) {
        super(params)

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConfigurationError)
        }

        this.name = 'ConfigurationError'
        this.dateTime = new Date()
    }
}