import { updateStore, ISettings, SettingStore } from './settings'
import { ProgramConfiguration, IProgramConfig } from './config/program-config'
import * as Runtime from './runtime/main'
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

        //
        // Validating start index for reading command line arguments

        // checking startIndex must be a number 
        if (SettingStore.processArgvStartIndex && isNaN(SettingStore.processArgvStartIndex)) {
            throw new RuntimeError('Cannot read command line arguments, invalid index', SettingStore.processArgvStartIndex)
        }

        // startIndex must be greater than equal to 2
        if (!SettingStore.processArgvStartIndex || SettingStore.processArgvStartIndex < 2) {
            throw new RuntimeError('Index to start read command line arguments from must be greater than equal to 2', SettingStore.processArgvStartIndex)
        }
    }

    /** Shows program or command help */
    public showHelp(commandName?: string) {
        if (commandName) {
            return Help.command(this.config, commandName)
        }
        return Help.program(this.config)
    }

    /** displays program version info */
    public showVersion() {
        return Help.version(this.config)
    }

    /** Runs the target program */
    static async run(target: Program) {
        var context = Runtime.createContext(target, Program)
        return Runtime.runProgram(target, context)
    }

    /** allows updating global settings */
    static settings(settings: ISettings) {
        updateStore(settings)
    }
}

