import * as Help from './help'
import { SettingStore } from './settings';
import { RuntimeError } from './errors/runtime-error';
import { ProgramArgs } from './program-args';
import { OptionCollection } from './config/option-config';
import { ParamCollection, ParamType } from './config/param-config';

// flag: sets when 'read' is performed 
var isReadingDone = false

/** flag: sets when unhandled rejection handler is attached to the process event */
var rejectionHandlerAttached = false

/** flag: sets when a program is running  */
var programRunning = false

/** Current iteration for runCommand method */
var commandIteration = 0
var maxCommandIteration = 2

/** Initializing Program Arguments */
const programArgs = new ProgramArgs()

/** Initializes runtime */
export function init() {

    // re-setting runCommand() iteration counter
    commandIteration = 0

    // re-setting programRunning state
    programRunning = false

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

/** Attaches event handler once to process' unhandled rejection event */
export function handleRejections(handler: any) {
    if (handler && typeof handler == 'function' && !rejectionHandlerAttached) {
        process.on('unhandledRejection', handler)
        rejectionHandlerAttached = true
    }
}

/** Calls a method of a program if exists */
async function callback(program: any, methodName: string, ...details: any[]) {
    if (program && program[methodName] && typeof program[methodName] == 'function') {
        return program[methodName].apply(program, details)
    }
}

/** gets an array of arguments that can be applied to a method */
function createMethodArgs(collection: ParamCollection, $params: any, $options: any) {
    var args = []
    for (var param of collection.getItems()) {
        args[param.$idx] = $params[param.propName]
    }
    if (collection.indexParamsParam) {
        args[collection.indexParamsParam] = $params
    }
    if (collection.indexOptionsParam) {
        args[collection.indexOptionsParam] = $options
    }
    return args
}

/** Checks Whether a program is already running */
export function running() {
    return programRunning
}

/** Starts a program */
export async function runProgram(program: any) {

    // set program running state 
    programRunning = true

    // validate program object
    if (!program) throw new RuntimeError('Unable to run the program')
    if (!program.config) throw new RuntimeError('Unable to run the program, program configuration missing')

    // 1. Read all arguments supplied to the program
    programArgs.read()

    // Show program help when no arguments are passed AND when any of nested condition is true
    if (programArgs.isEmpty()) {

        // Program is running in command mode
        // AND 'showHelpOnNoCommand' is enabled
        if (SettingStore.enableCommands && SettingStore.showHelpOnNoCommand) {
            return Help.program(program.config)
        }

        // Program is running in no-command mode
        // AND program params doesn't contain any required param
        if (!SettingStore.enableCommands && program.config.params.containsRequired()) {
            return Help.program(program.config)
        }
    }

    // 2. Handle global options

    // 2a. Show program or command help when --help option is supplied
    if (SettingStore.enableHelpOption && programArgs.containsOption(['help', 'h'])) {
        return Help.command(program.config, programArgs.commandName)
    }

    // 2b. Show program version when --version option is supplied
    if (SettingStore.enableVersionOption && programArgs.containsOption(['version', 'ver', 'v'])) {
        return Help.version(program.config)
    }

    // 3. Handle Program Options

    // 3a. create program options map
    var programOptions = {}
    try {
        programOptions = await programArgs.createOptionsMap(program.config.options)
    }
    catch (ex) {
        // Show program help when there is a runtime error reading program options AND
        // global setting showHelpOnInvalidOptions is set
        if (SettingStore.showHelpOnInvalidOptions) {
            console.error(ex.message)
            return Help.program(program.config)
        }

        // Otherwise re-throwing exception
        throw ex
    }

    // 3b. call 'onProgramOptions' when - 
    // 1. programOptions are defined AND 
    // 2. program commands are enabled AND
    // 3. command name is empty OR program options have more priority than command options
    if (Object.keys(programOptions).length > 1 && SettingStore.enableCommands && (!programArgs.commandName || SettingStore.prioritizeProgramOptions === true)) {
        return callback(program, 'onProgramOption', await programArgs.createParamsMap(), programOptions)
    }
    // 3c. otherwise treat all options as command options and pass to command method

    // 4. Handle Program's no-Command mode
    if (!SettingStore.enableCommands && SettingStore.mainMethod) {
        try {
            // 4a. create param map for program
            var programParams = await programArgs.createParamsMap(program.config.params)

            // 4b. call program's main method
            return callback(program, SettingStore.mainMethod, ...createMethodArgs(program.config.params, programParams, programOptions))
        } catch (ex) {

            // Showing command help
            if (SettingStore.showHelpOnInvalidParams) {
                return Help.program(program.config)
            }

            // Otherwise re-throwing exception
            throw ex
        }
    }

    // 5. Handle Program's Command mode

    // Get requested command
    var reqCommandName = programArgs.commandName || program.config.defaultCommand

    // Show help if requested command name is missing 
    if (!reqCommandName && SettingStore.showHelpOnNoCommand) {
        return Help.program(program.config)
    }

    // otherwise run command
    return runCommand(program, reqCommandName)
}

/** Runs a program command */
export async function runCommand(program: any, reqCommandName: string) {
    commandIteration++

    // Show command help when command name is 'help'
    if (reqCommandName == 'help' && SettingStore.enableHelpCommand) {
        return Help.program(program.config)
    }

    // Get command definition object for the requested command name
    var command = program.config.commands.getByName(reqCommandName)

    // Handle invalid command / command not found
    if (!command) {
        // show help if enabled
        if (SettingStore.showHelpOnNoCommand) {
            return Help.program(program.config)
        }

        // otherwise if maxCommandIteration is not reached, call onInvalidCommand methods
        if (commandIteration <= maxCommandIteration) {
            return callback(program, 'onInvalidCommand', reqCommandName, await programArgs.createParamsMap(), await programArgs.createOptionsMap())
        }

        // finally show program help
        return Help.program(program.config)
    }

    // otherwise, proceed further to execute the command

    // create command params map object
    var params: any = {}
    try {
        params = await programArgs.createParamsMap(command.params)
    }
    catch (ex) {
        // show help if enabled
        if (SettingStore.showHelpOnInvalidParams) {
            return Help.command(program.config, reqCommandName)
        }

        // Otherwise re-throwing exception
        throw ex
    }

    // create command options map object
    var options = {}
    try {
        options = await programArgs.createOptionsMap(command.options)
    }
    catch (ex) {
        // Show command help if enabled
        if (SettingStore.showHelpOnInvalidOptions) {
            return Help.command(program.config, reqCommandName)
        }

        // Otherwise re-throwing exception
        throw ex
    }

    // finally execute the command
    //   var a = command.params.createMap(params, options)
    return callback(program, command.methodName, ...createMethodArgs(command.params, params, options))

}

/** Exits the program. If exitProcess is set, exits the process manually */
export function exitProgram(program: any, exitCode: number = 0, exitProcess = false) {

    callback(program, 'onExit', exitCode).then(newExitCode => {
        process.exitCode = typeof newExitCode == 'undefined' ? exitCode : newExitCode
        if (exitProcess) {
            process.exit()
        }
    }).catch(err => {
        console.error(err)
        if (exitProcess) {
            process.exit()
        }
    })

}