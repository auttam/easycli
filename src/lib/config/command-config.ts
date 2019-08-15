import { Collection } from './collection'
import { ConfigurationError } from '../errors/config-error'
import { hyphenate, camelCase } from '../utility/string'
import { IConfig, Config } from './base-config'
import { ParamCollection, IParamConfig } from './param-config'
import { IOptionConfig, OptionCollection } from './option-config'

export interface ICommandConfig {
    /** name of the method */
    method: string

    /** Name of the command */
    name?: string

    /** help for the command */
    help?: string

    /** array of command parameters */
    params?: IParamConfig[]

    /** array of options */
    options?: IOptionConfig[]
}

/** Represents a Command */
export class Command extends Config {

    // Stores command params
    public params: ParamCollection

    // stores command options
    public options: OptionCollection

    /** 
     * @param {ICommandConfig} config configuration to be used to create command object
     */
    constructor(config: ICommandConfig) {
        if (!config.method) throw new ConfigurationError('Command cannot be created, method name is required', config)
        // creating command name from method name
        if (!config.name) {
            config.name = config.method.endsWith('Command') ? config.method.substr(0, config.method.lastIndexOf('Command')) : config.method
            config.name = hyphenate(config.name)
        }
        super({
            name: config.name,
            propName: config.method,
            help: config.help
        })

        // initializing params
        this.params = new ParamCollection()
        if (config.params) {
            this.params.addList(config.params)
        }

        // initializing options        
        this.options = new OptionCollection()
        if (config.options) {
            this.options.addList(config.options)
        }
    }

    toCommandConfig(): ICommandConfig {
        return {
            name: this.name,
            method: this.propName,
            help: this.help
        }
    }

    merge(config: ICommandConfig) {
        super.merge(config, { ignoreProps: ['options', 'params'] })
        this.name = config.name || this.name
        if (config.params) {
            this.params.addList(config.params)
        }
        if (config.options) {
            this.options.addList(config.options)
        }
    }
}

// /** Represents collection of command */
export class CommandCollection extends Collection<Command>{

    private _definedNames: any = {}

    /** Creates and adds command in the collection */
    add(config: ICommandConfig) {
        if (!config) throw new ConfigurationError('Command configuration cannot be null or undefined')

        // Check if command already exists
        if (super.hasKey(config.method)) {
            // merge if exists
            var command = super.get(config.method)
            command.merge(config)
            super.update(command.propName, command)
        } else {
            // add new if not exists
            var command = new Command(config)
            super.append(command.propName, command)
        }
    }

    addByCommand(command: Command) {
        if (!command) throw new ConfigurationError('Command cannot be null or undefined')

        // Check if command already exists
        if (super.hasKey(command.propName)) {
            super.update(command.propName, command)
        } else {
            // add new if not exists
            super.append(command.propName, command)
        }
    }

    /** Creates and adds command in the collection from a method definition */
    addBySignature(name: string, methodSignature: any) {
        var command = new Command({ method: name })
        command.params.addBySignature(methodSignature)
        this.addByCommand(command)
    }

    /** Creates and adds an array of commands in the collection */
    public addList(configs?: ICommandConfig[]) {

        // return if list is empty or undefined
        if (!configs || !configs.length) return

        // adding commands iteratively 
        configs.forEach(config => this.add(config))
    }

    // non-implemented methods
    protected validate(item: Command) {

        // Rule 1. there must not a command with same name
        if (this._definedNames[item.name] && this._definedNames[item.name] != item.propName) {
            throw new ConfigurationError('Unable to add command, command with same name already exists', item)
        }
    }

    protected itemAdded(item: Command): void {
        this._definedNames[item.name] = item.propName
    }

    /** Gets a command by name */
    public getByName(name: string): Command {
        return this.find(name, 'name')
    }

    /** Checks whether a command exists for the method name in the collection  */
    public hasMethod(methodName: string) {
        if (!methodName) return
        return this.hasKey(methodName)
    }

}
