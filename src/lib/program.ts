import { GlobalSettings } from './global-settings'
import { ProgramConfiguration } from './program-config'
import * as Runtime from './runtime'
import { RuntimeError } from './types/errors'

/** A base class for a cli program */
export class Program extends GlobalSettings {
    public config: ProgramConfiguration

    // Initialization:
    constructor(configuration?: any) {
        super()

        // setting 'config' with new or already injected configuration object
        this.config = ProgramConfiguration.injectConfiguration(this)

        // merging configuration parameter to the program's config object 
        this.config.merge(configuration)

        // Sealing the configuration object
        Object.seal(this.config)

        // initializing runtime
        Runtime.init()

    }

    // Startup:
    public start() {
        var self: Program = this

        // check if a program is already running
        if (Runtime.running()) {
            throw new RuntimeError('Cannot run program again when it is already in running state')
        }

        // Attach handler to unhandled Rejections event
        Runtime.handleRejections(Program.rejectionHandler)

        // Run program and wait for the promise resolution
        var promise = Runtime.runProgram(self)

        // Handling rejected promise
        promise.catch(async (err: any) => {

            // Printing error
            if (typeof err == 'string') err = 'Error: ' + err
            console.error(err)

            // exiting with error
            Runtime.exitProgram(self, 1)
        })

        // Handling on resolved promise
        promise.then(async () => {
            // existing without error
            Runtime.exitProgram(self)
        })
    }

    protected runCommand(commandName: string) {
        return Runtime.runCommand(this, commandName)
    }
}

