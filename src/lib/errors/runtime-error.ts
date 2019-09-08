import { EOL } from 'os'

/** Represents Runtime error that is thrown during program run time */
export class RuntimeError extends Error {
    public data: any
    constructor(message: string, data?: any) {
        super(message)

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RuntimeError)
        }

        this.name = 'RuntimeError'
        this.data = data
    }
}