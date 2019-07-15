import { CommandCollection } from './types/collections/commands'
import { OptionCollection } from './types/collections/options'
import { hyphenate, separateWords, getPropertyValue } from './utils'
import { GlobalSettings } from './global-settings'
import { IProgramInfo } from './types/info-objects'

export class ProgramConfiguration {

    // Program info
    public name: string = ''
    public description: string = ''
    public version: string = '1.0.0'
    public binaryName: string = ''
    public defaultCommand: string = ''

    // Command and Program Options
    public readonly commands: CommandCollection = new CommandCollection()
    public readonly options: OptionCollection = new OptionCollection()

    /** Initializes default configuration for the target object and injects 
     *  it into the target. If target already has an instance configuration, 
     *  returns the existing configuration. */
    public static injectConfiguration(target: any, propertyName: string = 'config'): ProgramConfiguration {

        // Creating and initializing new configuration if not already created
        if (!target[propertyName]) {

            var config = new ProgramConfiguration()

            // collecting program info from target
            if (target.constructor && target.constructor.name) {
                config.name = separateWords(target.constructor.name)
                config.binaryName = hyphenate(target.constructor.name)
            }

            // collecting names of commands using command convention
            for (var prop of Object.getOwnPropertyNames(Object.getPrototypeOf(target))) {
                if (typeof target[prop] == 'function' && prop.endsWith('Command')) {

                    // creating name by removing 'Command' suffix
                    var name = prop.substr(0, prop.lastIndexOf('Command'))

                    // adding command to command collection
                    config.commands.add({ method: prop, name: name })
                }
            }

            // setting default command if it exists in the 
            if (GlobalSettings.defaultCommandMethod() && typeof target[GlobalSettings.defaultCommandMethod()] == 'function') {
                config.defaultCommand = GlobalSettings.defaultCommandMethod()
            }

            // Injecting configuration to the target object
            target[propertyName] = config
        }
        return target[propertyName]
    }

    public merge(config: any) {
        if (!config || typeof config != 'object') return

        // merging program information
        this.name = getPropertyValue(config, 'name', this.name)
        this.description = getPropertyValue(config, 'description', this.description)
        this.version = getPropertyValue(config, 'version', this.version)
        this.binaryName = getPropertyValue(config, 'binaryName', this.binaryName)
        this.defaultCommand = getPropertyValue(config, 'defaultCommand', this.defaultCommand)

        // merging options
        this.options.mergeList(config.options)

        // merging commands
        this.commands.mergeList(config.commands)
    }

    /** Check whether there is any command defined other than the default command */
    public hasRealCommand() {
        // no command present
        if (!this.commands.length) return false

        // more than 1 command present, not need to check default method 
        if (this.commands.length > 1) return true

        // only 1 command present, it its not real command if matches default command
        if (this.commands.length == 1) return !this.commands.hasMethod(this.defaultCommand)
    }

    /** Gets program info */
    public getInfo(): IProgramInfo {
        return {
            name: this.name,
            binaryName: this.binaryName,
            description: this.description,
            version: this.version
        }
    }
}