import { EOL } from 'os'

/** Represents Runtime error that is thrown while CLI program is running */
export class RuntimeError extends Error {
    private details: any

    constructor(...params: any) {
        var details = params[1]
        if (details) {
            params.splice(1, 1)
        }
        super(...params)

        this.details = details

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RuntimeError)
        }

        this.name = 'RuntimeError'
    }
}

/** Represents Configuration error that is thrown during program configuration */
export class ConfigurationError extends Error {
    private details: any
    constructor(...params: any) {
        var details = params[1]
        if (details) {
            params.splice(1, 1)
            params[0] += EOL + JSON.stringify(details, null, 4)
        }
        super(...params)

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConfigurationError)
        }

        this.name = 'ConfigurationError'
    }
}