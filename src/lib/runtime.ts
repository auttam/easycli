const minimist = require('minimist')
import { RuntimeError } from './types/errors'
import { OptionCollection } from './types/collections/options'
import { ParamCollection } from './types/collections/params'
import { ParamType } from './types/info-objects'
import { GlobalSettings } from './global-settings'
import * as Help from './help'

// flag: set when 'read' is performed 
var isReadingDone = false

/** List of all arguments read from cli */
var retrievedArgs = []

/** Arguments as parsed by minimist */
var parsedArgs: any = {}

/** Command Name */
var commandName = ''

/** Params List */
var paramList: []

/** Options */
var optionsObject: any = {}

/** flag: set when unhandled rejection handler is attached to the process event */
var rejectionHandlerAttached = false

/** flag: set when a program is running  */
var programRunning = false

/** Current iteration for runCommand method */
var commandIteration = 0
var maxCommandIteration = 2

/** initialize runtime */
export function init() {

    // re-setting runCommand() iteration counter
    commandIteration = 0

    // re-setting programRunning state
    programRunning = false

    //
    // Validating start index for reading command line arguments

    // checking startIndex must be a number 
    if (GlobalSettings.processArgvStartIndex() && isNaN(GlobalSettings.processArgvStartIndex())) {
        throw new RuntimeError('Cannot read command line arguments, invalid index', GlobalSettings.processArgvStartIndex())
    }

    // startIndex must be greater than equal to 2
    if (GlobalSettings.processArgvStartIndex() < 2) {
        throw new RuntimeError('Index to start read command line arguments from must be greater than equal to 2', GlobalSettings.processArgvStartIndex())
    }

}

/** Reads arguments from command line and parses them into command name, params and options */
export function readArgs() {

    // no need to proceed if reading is already done
    if (isReadingDone) return

    // reading raw arguments
    retrievedArgs = process.argv.slice(GlobalSettings.processArgvStartIndex())

    // parsing raw arguments into minimist's parsed object
    if (GlobalSettings.minimistOptionsObject()) {
        parsedArgs = minimist(retrievedArgs, GlobalSettings.minimistOptionsObject())
    } else {
        parsedArgs = minimist(retrievedArgs)
    }

    // Getting command name from cli arguments
    commandName = parsedArgs._ && parsedArgs._.length ? parsedArgs._[0] : ''

    // Getting Params
    parsedArgs._.shift()
    paramList = parsedArgs._ || []

    // Getting options
    delete parsedArgs._
    optionsObject = parsedArgs

    // set flag that cli arguments have been read 
    isReadingDone = true
}

/** Gets count of the raw arguments passed to the command line */
export function argsCount() {
    return retrievedArgs.length
}

/** Gets the command name passed to the cli */
export function getCommandName() {
    return commandName
}

/** Gets whether any option set from the command line  */
export function hasOption(searchFor?: string | string[]): boolean {
    searchFor = searchFor || ''
    // return false if optionsObject is not set or null
    if (!optionsObject) return false

    // return if any option is set
    if (!searchFor) return !!Object.keys(optionsObject).length

    // return if optionsObject has searchFor
    if (searchFor && typeof searchFor == 'string') return optionsObject.hasOwnProperty(searchFor)

    // return if optionsObject has any options from searchFor List 
    if (searchFor && Array.isArray(searchFor)) {
        for (var item of searchFor) {
            if (typeof item == 'string' && optionsObject.hasOwnProperty(item)) return true
        }
    }

    // options not present
    return false
}

/** Returns an object containing all the options passed from the cli that matches to the collection*/
export function getOptions(optionCollection?: OptionCollection) {

    var matchedOptions: any = {}

    // return all options if collection is not specified
    if (!optionCollection) return {
        _: Object.assign({}, optionsObject)
    }

    // iterating over all defined options in the collection
    for (var option of optionCollection.getItems()) {

        // matching with option name
        if (option.name && optionsObject.hasOwnProperty(option.name)) {
            matchedOptions[option.name] = optionsObject[option.name]
        }

        // matching with aliases
        if (option.alias && option.alias.length) {
            for (var alias of option.alias) {
                if (optionsObject.hasOwnProperty(alias)) {
                    matchedOptions[alias] = optionsObject[alias]
                }
            }
        }
    }

    // adding remaining options
    matchedOptions._ = {}
    for (var prop of Object.keys(optionsObject)) {
        if (!matchedOptions.hasOwnProperty(prop)) {
            matchedOptions._[prop] = optionsObject[prop]
        }
    }
    return matchedOptions

}

/** Returns an object containing parameters passed from the cli that matches to the collection */
export async function getParams(paramCollection?: ParamCollection) {
    // object containing parameters mapped to passed cli argument
    var paramMap: any = {}

    // return all params if collection is not present
    // or is empty
    if (!paramCollection || !paramCollection.length) return {
        _: Array.from(paramList)
    }

    // first param to process
    var currentParamListIdx = 0

    for (var param of paramCollection.getItems()) {

        // param name cannot be blank
        // following check is for bypass typescript type check
        if (!param.name) return

        // Setting default value to the optional parameter
        // when no parameter is passed to the cli
        if (!paramList.length) {
            // Set value to required param only if default value is defined 
            if (!param.required || typeof param.value != 'undefined') {
                paramMap[param.name] = param.value || ''
                continue
            }
        }

        // otherwise ->

        // Required param check
        // Throw error if required parameter is missing and doesn't have default value
        if (param.required && !paramList[currentParamListIdx] && typeof param.value == 'undefined') {
            throw new RuntimeError('Required parameter missing', param.name)
        }

        // single value
        if (param.type == ParamType.SINGLE) {
            paramMap[param.name] = paramList[currentParamListIdx]
            currentParamListIdx++
            continue
        }

        // list of values
        if (param.type == ParamType.LIST) {
            paramMap[param.name] = paramList.slice(currentParamListIdx)
            currentParamListIdx = paramList.length
            continue
        }

        // single value from choice 
        if (param.type == ParamType.CHOICE) {
            param.choices = param.choices || []
            if (param.choices.indexOf(paramList[currentParamListIdx]) == -1) {
                throw new RuntimeError(`Unexpected parameter value expected: ${param.choices.join(', ')}`, param.name)
            }
            paramMap[param.name] = paramList[currentParamListIdx]
            currentParamListIdx++
            continue
        }

        return paramMap
    }
}

/** Attaches event handler to process events */
export function handleRejections(handler: any) {
    if (handler && typeof handler == 'function' && !rejectionHandlerAttached) {
        process.on('unhandledRejection', handler)
        rejectionHandlerAttached = true
    }
}

/** Calls a method of a program if exists */
export async function callback(program: any, methodName: string, ...details: any[]) {
    if (program && program[methodName] && typeof program[methodName] == 'function') {
        return program[methodName].apply(program, details)
    }
}

/** Checks Whether a program is already running */
export function running() {
    return programRunning
}

/** Start running a program */
export async function runProgram(program: any) {

    // setting program running state 
    programRunning = true

    // check for program object
    if (!program) throw new RuntimeError('Unable to run the program')
    if (!program.config) throw new RuntimeError('Unable to run the program, program configuration missing')

    // 1. Read Cli Arguments
    readArgs()

    // 1. Handle global options

    // 1a. Handle Global --help Option
    if (GlobalSettings.helpOptionEnabled() && hasOption('help')) {
        return Help.command(program.config, getCommandName())
    }

    // 1b. Handle Global --version Option
    if (GlobalSettings.versionOptionEnabled() && hasOption(['version', 'ver', 'v'])) {
        return Help.version(program.config)
    }

    // 2. Handle Program Options
    var programOptions = getOptions(program.config.options)

    // checking if programOptions has properties other than '_'
    if (Object.keys(programOptions).length > 1 && (!getCommandName() || GlobalSettings.programOptionsPrioritized() === true)) {
        return callback(program, 'onProgramOption', await getParams(), programOptions)
    }

    // 3. Handle Program Command

    // Check when no arguments are passed
    if (!argsCount() && GlobalSettings.showHelpOnNoCommand()) {
        return Help.program(program.config)
    }

    // Get requested command
    var reqCommandName = getCommandName() || program.config.defaultCommand

    // Check when command or even default command is missing, 
    if (!reqCommandName && GlobalSettings.showHelpOnNoCommand()) {
        return Help.program(program.config)
    }

    // run command
    return runCommand(program, reqCommandName)
}

/** Start running a program command */
export async function runCommand(program: any, reqCommandName: string) {
    commandIteration++
    // handling help command
    if (reqCommandName == 'help' && GlobalSettings.helpCommandEnabled()) {
        return Help.program(program.config)
    }

    // getting command object for requested command name
    var command = program.config.commands.getByName(reqCommandName)

    // Handling invalid command
    if (!command) {
        // showing help if such setting found
        if (GlobalSettings.showHelpOnNoCommand()) {
            return Help.program(program.config)
        }

        // otherwise if maxCommandIteration is not reached, calling onInvalidCommand 
        if (commandIteration <= maxCommandIteration) {
            return callback(program, 'onInvalidCommand', reqCommandName, await getParams(), getOptions())
        }

        // finally showing program help
        return Help.program(program.config)
    }

    // Getting command params
    var params: any = {}
    try {
        params = await getParams(command.params)
    }
    catch (ex) {
        // Showing command help
        if (GlobalSettings.showHelpOnInvalidParams()) {
            return Help.command(program.config, reqCommandName)
        }

        // Otherwise re-throwing exception
        throw ex
    }

    // Getting command options
    var options = getOptions(program.config.options)

    // executing command
    return callback(program, command.methodName, params, options)

}

export function exitProgram(program: any, exitCode: number = 0) {

    callback(program, 'onExit', exitCode).then(newExitCode => {
        process.exitCode = typeof newExitCode == 'undefined' ? exitCode : newExitCode
    }).catch(err => {
        console.error(err)
    })

}

