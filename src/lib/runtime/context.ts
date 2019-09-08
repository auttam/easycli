import { ParamCollection } from '../config/param-config'
import { ProgramArgs } from './program-args'
import { SettingStore } from '../settings'
import { OptionCollection } from '../config/option-config'
import * as Help from '../help'

export enum RuntimeStates {
    CREATED = 'created',
    READY = 'ready',
    RUNNING = 'running',
    ERROR = 'error'
}

export class RuntimeContext {
    // Private properties
    private _id = Date.now() + Math.random()
    private _state: RuntimeStates = RuntimeStates.CREATED
    private _progArgs: ProgramArgs = new ProgramArgs()
    private _requestedCommand: string = ''

    /** Current iteration for runCommand method */
    private _commandIteration = 0
    private _maxCommandIteration = 2

    // constructor
    constructor(private _program: any) { }

    // read only properties

    /** state of program execution */
    get state() {
        return this._state
    }

    /** context id */
    get contextId() {
        return this._id
    }

    /** name of command to be executed */
    get requestedCommand() {
        return this._requestedCommand
    }

    /** flag set if help is requested via supplying help option or help command */
    get helpRequested() {
        if (this._progArgs.containsOption(['help', 'h']) && SettingStore.enableHelpOption) return true
        if (this._requestedCommand.toLowerCase() == 'help' && SettingStore.enableHelpCommand) return true
        return false
    }

    /** flag set if version is requested via supplying --ver, --version or -v options */
    get versionRequested() {
        if (this._progArgs.containsOption(['version', 'ver', 'v']) && SettingStore.enableVersionOption) return true
        return false
    }

    // private methods

    /** maps supplied arguments with configured options */
    private async mapOptions(optionCollection: OptionCollection, commandName?: string) {
        var options
        // map options for the main method
        try {
            // options
            options = await this._progArgs.createOptionsMap(optionCollection)
        } catch (ex) {

            // Showing command help
            if (SettingStore.showHelpOnInvalidOptions) {
                return Help.optionInfo(this._program.config, this.requestedCommand, ex.data, ex.message)
            }

            // Otherwise re-throwing exception
            throw ex
        }

        return options
    }

    /** maps supplied arguments with configured params */
    private async mapParams(paramCollection: ParamCollection, commandName?: string) {
        var params
        try {
            params = await this._progArgs.createParamsMap(paramCollection)
        } catch (ex) {

            // Showing command help
            if (SettingStore.showHelpOnInvalidParams) {
                return Help.paramInfo(this._program.config, this.requestedCommand, ex.data, ex.message)
            }

            // Otherwise re-throwing exception
            throw ex
        }
        return params
    }

    /** gets an array of arguments that can be applied to a method */
    private createMethodArgs(collection: ParamCollection, $params: any, $options: any) {
        var args = []
        for (var param of collection.getItems()) {
            if ($params.$has(param.propName)) {
                args[param.$idx] = $params[param.propName]
            }
        }
        if (collection.indexParamsParam > -1) {
            args[collection.indexParamsParam] = $params
        }
        if (collection.indexOptionsParam > -1) {
            args[collection.indexOptionsParam] = $options
        }
        return args
    }

    /** helper method to call default command method */
    private callDefaultCommand() {
        // call default command method if implemented in target program
        if (SettingStore.defaultCommandMethod && this._program[SettingStore.defaultCommandMethod]) {
            return this.call(SettingStore.defaultCommandMethod)
        }
    }

    /** checks whether target program is set, throws type error otherwise */
    private validateProgram() {
        if (!this._program) {
            throw new TypeError('Context not initialized')
        }
    }

    // public methods

    /** initialize context */
    public init() {
        // read program arguments as supplied through command prompt
        this._state = RuntimeStates.READY
        this._progArgs.read()
        this._requestedCommand = this._progArgs.getCommandName()
    }

    /** calls a method of the target program */
    public call(methodName: string, ...details: any[]) {
        if (this._program && this._program[methodName] && typeof this._program[methodName] == 'function') {
            return this._program[methodName].apply(this._program, details)
        }
    }

    /** runs target program */
    public async runProgram() {

        this.validateProgram()

        // check if a program is not in ready state
        if (this._state != RuntimeStates.READY) {
            throw new TypeError('Cannot run program due to incorrect program state')
        }

        // handling no-command mode
        if (!SettingStore.enableCommands) {

            // show help if main() requires a parameter and no arguments supplied through cli
            if (this._progArgs.isEmpty() && this._program.config.params.containsRequired()) {
                return this._program.showHelp()
            }

            // call main method
            if (SettingStore.mainMethod && this._program[SettingStore.mainMethod]) {
                var $params = await this.mapParams(this._program.config.params)
                var $options = await this.mapOptions(this._program.config.options)

                // if params and option are null that means there was an exception
                // while creating map thus cannot execute method 
                if (!$params || !$options) return
                return this.call(SettingStore.mainMethod, ...this.createMethodArgs(this._program.config.params, $params, $options))
            }

            // otherwise do nothing
            return

        }

        // handling command mode
        if (SettingStore.enableCommands) {

            // handle situation when no arguments supplied through cli
            if (this._progArgs.isEmpty()) {

                // show help if showHelpOnNoCommand is set to false
                if (SettingStore.showHelpOnNoCommand) {
                    return this._program.showHelp()
                }

                // call default command method if showHelpOnNoCommand is set to false
                return this.callDefaultCommand()
            }

            // handle situation when options are set but not parameters
            if (!this._requestedCommand) {
                return this.callDefaultCommand()
            }

            // handle situation when program is running in command mode
            // but commands are not configured
            if (!this._program.config.commands.length) {
                return this.callDefaultCommand()
            }

            // handle situation when program options are also configured along with commands
            // AND program options are prioritied over command options
            // AND program options supplied from command line
            if (this._program.config.options.length && SettingStore.prioritizeProgramOptions === true) {

                var progOption = await this.mapOptions(this._program.config.options)
                // if progOption is null, there was an exception cannot proceed further
                if (!progOption) return

                // check if supplied options got mapped with configured options
                // note: option map will always have '_' property with all supplied options
                if (Object.keys(progOption).length > 1) {
                    // calling backing onProgramOptions(programOptions)
                    return this.call('onProgramOption', progOption)
                }
            }
            // proceed further to run the command
            return this.runCommand(this._requestedCommand)
        }

    }

    /** runs a command method on target program */
    public async runCommand(reqCommandName: string) {
        this._commandIteration++

        // prevent calling of this method with command name
        if (!reqCommandName) new TypeError('Cannot run command, command name missing')

        this.validateProgram()

        // Get command definition object for the requested command name
        var command = this._program.config.commands.getByName(reqCommandName)

        // handle invalid command name
        if (!command) {

            // call 'onInvalidCommand'
            if (this._commandIteration <= this._maxCommandIteration) {
                return this.call('onInvalidCommand', reqCommandName)
            }

            // finally show program help
            return this._program.showHelp()
        }

        //  execute the command
        var $params = await this.mapParams(command.params)
        var $options = await this.mapOptions(command.options)
        // if params and option are null that means there was an exception
        // while creating map thus cannot execute method 
        if (!$params || !$options) return
        return this.call(command.propName, ...this.createMethodArgs(command.params, $params, $options))

    }

    /** ends target program */
    public exitProgram(error: any, executionResult: any, exitCode: number = 0) {
        this.validateProgram()
        if (typeof exitCode != 'undefined') {
            process.exitCode = exitCode
        }
        // re-throw error if onExit method is not implemented
        if (error && !this._program['onExit']) throw error

        // call onExit
        return this.call('onExit', error, executionResult)
    }
}