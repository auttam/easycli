import { updateStore, ISettings, SettingStore } from './settings'
import { ProgramConfiguration, IProgramConfig } from './config/program-config'
import * as Runtime from './runtime'
import { RuntimeError } from './errors/runtime-error'

import * as Help from './help'

/** A base class for a cli program */
export class Program {
    public config: ProgramConfiguration

    // Initialization:
    constructor(configuration?: IProgramConfig) {

        // setting 'config' with new or already injected configuration object
        this.config = ProgramConfiguration.injectConfiguration(this)

        // merging configuration to the program's config object 
        this.config.merge(configuration)

        // Sealing the configuration object
        Object.seal(this.config)

        // initializing runtime
        Runtime.init()

    }

    static settings(settings: ISettings) {
        updateStore(settings)
    }

    // Startup:
    public start() {
        var self: Program = this

        // check if a program is already running
        if (Runtime.running()) {
            throw new RuntimeError('Cannot run program again when it is already in running state')
        }

        // Attach handler to unhandled Rejections event
        Runtime.handleRejections(SettingStore.rejectionHandler)

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

    /** Runs a command manually */
    protected runCommand(commandName: string) {
        return Runtime.runCommand(this, commandName)
    }

    /** Shows program or command help */
    protected help(commandName?: string) {
        if (commandName) {
            return Help.command(this.config, commandName)
        }
        return Help.program(this.config) // call Help.program
    }

    /** Exits program and ends the current process  */
    protected exit(code?: number) {
        Runtime.exitProgram(code)
    }
}

