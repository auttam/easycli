import { Collection } from './base'
import { ICommandInfo } from '../info-objects'
import { ConfigurationError } from '../errors'
import { hyphenate, camelCase, getPropertyValue } from '../../utils'
import { ParamCollection } from './params'
import { OptionCollection } from './options'

/** Represents a Command */
export class Command {

    // Stores the name  
    commandName: string = ''

    // Stores the description of the command
    description: string = ''

    // Stores the name of command method which is mapped to the command name
    readonly methodName: string

    // Stores command params
    params: ParamCollection

    // stores command options
    options: OptionCollection

    /** 
     * @param {string} methodName name of the method to execute when running this command
     * @param {IDescribable} commandDescription description of the command 
     * 
     */
    constructor(commandInfo: ICommandInfo) {
        if (!commandInfo.method) throw new ConfigurationError('Command cannot be created, method name is required', commandInfo)

        // initializing command definition
        this.methodName = commandInfo.method
        this.commandName = commandInfo.name || hyphenate(commandInfo.method)
        this.description = commandInfo.description || 'No Description'

        // initializing params
        this.params = new ParamCollection()
        if (commandInfo.params) {
            this.params.addList(commandInfo.params)
        }

        // initializing options        
        this.options = new OptionCollection()
        if (commandInfo.options) {
            this.options.addList(commandInfo.options)
        }

    }

    /** Gets command info */
    getInfo(): ICommandInfo {
        return {
            name: this.commandName,
            description: this.description,
            method: this.methodName
        }
    }
}

/** Represents collection of command */
export class CommandCollection extends Collection<Command>{

    // list of all command names 
    private _definedNames: string[] = []

    public add(commandInfo: ICommandInfo, update?: boolean) {
        if (!commandInfo) throw new ConfigurationError('Command cannot be null or undefined')

        // adding Command
        if (update) {
            super.update(commandInfo.method, new Command(commandInfo))
        }
        else {
            super.append(commandInfo.method, new Command(commandInfo))
        }
    }

    /** Adds a list of commands */
    public addList(commandList?: ICommandInfo[], update?: boolean) {

        // return if list is empty or undefined
        if (!commandList || !commandList.length) return

        // adding options iteratively 
        commandList.forEach(commandInfo => this.add(commandInfo, update))
    }

    // non-implemented methods
    protected setupItem(command: Command) { return command }
    protected finalizeItem(command: Command) { }
    protected validateItem(command: Command) {

        // Rule 1. there must not a command with same name
        var matched = this._definedNames.indexOf(command.commandName) > -1

        if (matched) {
            throw new ConfigurationError('Unable to add command, command with same name already exists', command.commandName)
        }

    }

    /** Merges info with an existing command, or add as new command */
    public merge(commandInfo: ICommandInfo) {

        // Getting existing command 
        var command = this.get(commandInfo.method || '')

        // merging and updating command if already exists 
        if (command) {

            command.commandName = getPropertyValue(commandInfo, 'commandName', command.commandName)
            command.description = getPropertyValue(commandInfo, 'description', command.description)

            // updating option collection
            if (commandInfo.options) {
                command.options.mergeList(commandInfo.options)
            }

            // updating param collection
            if (commandInfo.params) {
                command.params.mergeList(commandInfo.params)
            }

            this.update(command.methodName, command)
        }

        // otherwise adding an command
        else {
            this.add(commandInfo)
        }

    }

    /** Merges infos with the existing commands, or add as new commands */
    public mergeList(commandList: ICommandInfo[]) {

        // return if list is empty or undefined
        if (!commandList || !commandList.length) return

        // adding commands iteratively 
        commandList.forEach(commandInfo => this.merge(commandInfo))

    }

    /** Gets a command by name */
    public getByName(name: string) {
        return this.find(name, 'commandName')
    }

    /** Checks whether a command exists for the method name in the collection  */
    public hasMethod(methodName: string) {
        if (!methodName) return
        return this.hasKey(methodName)
    }

}