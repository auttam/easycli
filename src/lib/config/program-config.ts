import { Config } from './base-config'
import { CommandCollection, ICommandConfig } from './command-config'
import { OptionCollection, IOptionConfig } from './option-config'
import { ParamCollection, IParamConfig } from './param-config'
import { hyphenate, separateWords } from '../utility/string'
import { getOwnFunctions } from '../utility/reflection'
import { SettingStore } from '../settings'

export interface IProgramConfig {
    /** name of the program / cli */
    name?: string
    /** cli name as specified in "bin" field of package.json */
    binaryName?: string
    /** help on program */
    help?: string
    /** program version number */
    version?: string
    /** default command name */
    defaultCommand?: string
    /** array of command parameters */
    params?: IParamConfig[]
    /** array of options */
    options?: IOptionConfig[]
    /** commands */
    commands?: ICommandConfig[]
}

export class ProgramConfiguration {

    // Program info
    public name: string = ''
    public help: string = ''
    public version: string = '1.0.0'
    public binaryName: string = ''
    public defaultCommand: string = ''

    // Command and Program Options
    public readonly commands: CommandCollection = new CommandCollection()
    public readonly options: OptionCollection = new OptionCollection()
    public readonly params: ParamCollection = new ParamCollection()

    /** Initializes default configuration for the target object and injects 
     *  it into the target. If target already has an instance configuration, 
     *  returns the existing configuration. */
    public static injectConfiguration(target: any, propertyName: string = 'config'): ProgramConfiguration {

        // Creating and initializing new configuration if not already created
        if (!target[propertyName]) {

            var progConfig = new ProgramConfiguration()

            // collecting program info from target
            if (target.constructor && target.constructor.name) {
                progConfig.name = separateWords(target.constructor.name)
                progConfig.binaryName = hyphenate(target.constructor.name)
            }

            // Check if target is not Program Class itself
            if (target.constructor.name != 'Program') {
                // generate command configuration
                if (SettingStore.commandsEnabled) {
                    var nonCmdMethods = SettingStore.nonCmdMethods || []
                    // collecting names of commands using command convention
                    for (var prop of getOwnFunctions(target)) {
                        if (prop.endsWith('Command') && nonCmdMethods.indexOf(prop) == -1) {

                            // adding command to command collection
                            progConfig.commands.addBySignature(prop, target[prop])
                        }
                    }
                } else {
                    // generate program parameter configuration
                    if (SettingStore.mainMethod && target[SettingStore.mainMethod]) {
                        progConfig.params.addBySignature(target[SettingStore.mainMethod])
                    }
                }
            }

            // setting default command if it exists in the 
            if (SettingStore.defaultCommandMethod && typeof target[SettingStore.defaultCommandMethod] == 'function') {
                progConfig.defaultCommand = SettingStore.defaultCommandMethod
            }

            // Injecting program configuration to the target object
            target[propertyName] = progConfig
        }
        return target[propertyName]
    }

    public merge(config: IProgramConfig) {
        if (!config || typeof config != 'object') return

        // merging program information
        this.name = config.name || this.name
        this.help = config.help || this.help
        this.version = config.version || this.version
        this.binaryName = config.binaryName || this.binaryName
        this.defaultCommand = config.defaultCommand || this.defaultCommand

        // merging options
        this.options.addList(config.options)

        // merging params
        this.params.addList(config.params)

        // merging commands
        this.commands.addList(config.commands)
    }

    /** Check whether there is any command defined other than the default command */
    public hasRealCommand() {
        // no command present
        if (!this.commands.length) return false

        // more than 1 command present, not need to check default method 
        if (this.commands.length > 1) return true

        // only 1 command present, it its not real command if matches default command
        if (this.commands.length == 1) return !this.commands.hasMethod(SettingStore.defaultCommandMethod || '')
    }

    /** Gets program configs */
    public toConfig(): IProgramConfig {
        return {
            name: this.name,
            binaryName: this.binaryName,
            help: this.help,
            version: this.version
        }
    }
}
