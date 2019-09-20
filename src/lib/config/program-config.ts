import { Config } from './base-config'
import { CommandCollection, ICommandConfig } from './command-config'
import { OptionCollection, IOptionConfig } from './option-config'
import { ParamCollection, IParamConfig } from './param-config'
import { hyphenate, separateWords } from '../utility/string'
import { getOwnFunctions } from '../utility/reflection'
import { SettingStore } from '../settings'
import { ConfigurationError } from '../errors/config-error'

export interface IProgramConfig {
    /** name of the program / cli */
    name?: string
    /** cli name as specified in "bin" field of package.json */
    binaryName?: string
    /** help on program */
    help?: string
    /** program version number */
    version?: string
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

    // Command and Program Options
    public readonly commands: CommandCollection = new CommandCollection()
    public readonly options: OptionCollection = new OptionCollection()
    public readonly params: ParamCollection = new ParamCollection()

    // flag to set use of decorators
    public decoratorsEnabled: boolean = false

    /** Initializes default configuration for the target object and injects 
     *  it into the target. If target already has an instance configuration, 
     *  returns the existing configuration. */
    public static injectConfiguration(target: any, propertyName: string = 'config'): ProgramConfiguration {

        // Creating and initializing new configuration if not already created
        if (!target[propertyName]) {

            var progConfig = new ProgramConfiguration()

            // reading configuration from target
            progConfig.readFromObject(target)

            // Injecting program configuration to the target object
            target[propertyName] = progConfig
        }
        return target[propertyName]
    }

    public readFromObject(source: any) {

        // collecting program info from target
        if (source.constructor && source.constructor.name) {
            if (source.constructor.name == 'Object') {
                throw new ConfigurationError('Source must have a named constructor', source)
            }
            this.name = separateWords(source.constructor.name)
            this.binaryName = hyphenate(source.constructor.name)
        }

        // Check if source is not Program Class itself
        if (source.constructor.name != 'Program') {
            // generate command configuration
            if (SettingStore.enableCommands) {
                var nonCmdMethods = SettingStore.nonCmdMethods || []
                // collecting names of commands using command convention
                for (var prop of getOwnFunctions(source)) {
                    // don't add default command into command collection as
                    // params and options for default command need not to be configured                    
                    if (prop && prop == SettingStore.defaultCommandMethod) { return }
                    if (prop.endsWith('Command') && nonCmdMethods.indexOf(prop) == -1) {
                        // adding command to command collection
                        this.commands.addMethod(prop, source[prop])
                    }
                }
            } else {
                // generate program parameter configuration
                if (SettingStore.mainMethod && source[SettingStore.mainMethod]) {
                    this.params.initByMethod(source[SettingStore.mainMethod])
                }
            }
        }

    }

    public merge(config?: IProgramConfig) {
        if (!config || typeof config != 'object') return

        // merging program information
        this.name = config.name || this.name
        this.help = config.help || this.help
        this.version = config.version || this.version
        this.binaryName = config.binaryName || this.binaryName

        // merging options
        this.options.addList(config.options)

        // merging params
        this.params.mergeByConfigs(config.params || [])

        // merging commands
        this.commands.addList(config.commands)
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

    /** Validates configuration */
    public verify() {
        if (SettingStore.enableCommands) {
            this.commands.verify()
        }
        else {
            this.params.verify()
        }

    }
}
