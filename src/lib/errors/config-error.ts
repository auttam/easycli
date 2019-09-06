import { EOL } from 'os'

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