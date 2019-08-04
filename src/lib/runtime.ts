const minimist = require('minimist')
import { RuntimeError } from './types/errors'
import { OptionCollection } from './types/collections/options'
import { ParamCollection } from './types/collections/params'
import { ParamType } from './types/info-objects'
import { GlobalSettings } from './global-settings'
import * as Help from './help'

// flag: sets when 'read' is performed 
var isReadingDone = false

/** flag: sets when unhandled rejection handler is attached to the process event */
var rejectionHandlerAttached = false

/** flag: sets when a program is running  */
var programRunning = false

/** All arguments supplied to the program */
var suppliedArgs = []

/** Object containing arguments parsed by minimist */
var parsedArgs: any = {}

/** Object containing all supplied arguments categorized into command name, params and options for the program */
const programArgs: { commandName: string, params: string[], options: any, [propName: string]: any } = {
    commandName: '',
    params: [],
    options: {},
    /** Checks whether any option supplied to the program */
    getOptionNames: function () {
        return !!Object.keys(this.options).length
    },

    /** Checks whether program arguments contain specific option(s) */
    containsOption: function (name: string | string[]) {
        if (!name) return false
        if (!Array.isArray(name)) {
            name = [name]
        }

        // return if programArgs.options has any options from optionName List 
        for (var item of name) {
            if (typeof item == 'string' && this.options.hasOwnProperty(item)) return true
        }

        // options not present
        return false
    }
}
Object.seal(programArgs)

/** Current iteration for runCommand method */
var commandIteration = 0
var maxCommandIteration = 2

/** Initializes runtime */
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

/** Reads arguments supplied to the program from command line and parses them into program arguments */
export function readArgs() {

    // no need to proceed if reading is already done
    if (isReadingDone) return

    // reading raw arguments
    suppliedArgs = process.argv.slice(GlobalSettings.processArgvStartIndex())

    // parsing raw arguments into minimist's parsed object
    if (GlobalSettings.minimistOptionsObject()) {
        parsedArgs = minimist(suppliedArgs, GlobalSettings.minimistOptionsObject())
    } else {
        parsedArgs = minimist(suppliedArgs)
    }

    // setting first cli argument as command name
    if (GlobalSettings.enableCommands()) {
        programArgs.commandName = parsedArgs._ && parsedArgs._.length ? parsedArgs._[0] : ''
        parsedArgs._.shift()
    }

    // setting all supplied non-option arguments as program params
    programArgs.params = parsedArgs._ || []

    // setting all supplied options as program options 
    delete parsedArgs._
    programArgs.options = parsedArgs

    // setting flag that cli arguments have been read 
    isReadingDone = true
}

function getAllowedValue(value: string | string[], infoObject?: any): void | string | string[] {
    if (!value || !infoObject) return value

    // Get only allowed values when the info object contains a list of allowed value -->
    if (infoObject.allowedValues && Array.isArray(infoObject.allowedValues)) {

        // prepare a list to allowed values for case-insensitive search
        var allowedValues = infoObject.allowedValues.map((value: string) => value.toLowerCase())

        var matchedValue

        // get list of matched values from the allowed list when the value is an array
        if (Array.isArray(value) && value.length) {
            matchedValue = []
            for (var eachValue of value) {
                var idx = allowedValues.indexOf(eachValue.toLowerCase())
                if (idx > -1) {
                    matchedValue.push(infoObject.allowedValues[idx])
                }
            }
        }

        // get single matched value from the allowed list when value is a string 
        if (!Array.isArray(value)) {
            var idx = allowedValues.indexOf(value.toLowerCase())
            if (idx > -1) {
                matchedValue = infoObject.allowedValues[idx]
            }
        }

        // if no value is matched, set a default value as matched 
        if (!matchedValue && typeof infoObject.value != 'undefined') {
            matchedValue = infoObject.value
        }

        // throw run time exception if there is still no matched value at this point
        if (!matchedValue) {
            throw new RuntimeError(`Value not allowed for ${infoObject.name} ${(infoObject.type ? ' parameter' : ' option')} allowed values are ' ${infoObject.allowedValues.join(', ')}`)
        }

        return matchedValue
    }

    // otherwise return value as is ->
    return value
}

/** Creates a map for all defined options that are supplied to the program */
async function createOptionsMap(definedOptions?: OptionCollection) {

    var mappedOptions: any = {}

    // assign all options to default '_' property
    mappedOptions._ = Object.assign({}, programArgs.options)

    // no need to proceed if definitions are missing
    if (!definedOptions) return mappedOptions

    // iterating over all defined options in the collection
    for (var optionInfo of definedOptions.getItems()) {

        var value = null
        var name = optionInfo.name || ''

        // matching defined option name with the supplied options
        if (optionInfo.name && programArgs.options.hasOwnProperty(optionInfo.name)) {
            value = programArgs.options[optionInfo.name]
        }

        // matching option's other names with the supplied options
        if (optionInfo.otherNames && optionInfo.otherNames.length) {
            for (var otherNames of optionInfo.otherNames) {
                if (programArgs.options.hasOwnProperty(otherNames)) {
                    value = programArgs.options[otherNames]
                    name = optionInfo.name || otherNames
                }
            }
        }

        // validating supplied value of the option with the pre-defined set of values
        value = getAllowedValue(value, optionInfo)

        // adding option to the map object
        if (value && name) {
            mappedOptions[name] = value
        }
    }
    return mappedOptions
}

/** Creates a map for all defined params that are supplied to the program */
async function createParamsMap(definedParams?: ParamCollection) {
    // object containing parameters mapped to supplied argument
    var mappedParams: any = {}

    // assign all options to default '_' property
    mappedParams._ = Array.from(programArgs.params)

    // no need to proceed if definition is not available
    if (!definedParams || !definedParams.length) {
        return mappedParams
    }

    // first param to process
    var currentParamListIdx = 0

    for (var paramInfo of definedParams.getItems()) {

        // param name cannot be blank
        // following check is for bypass typescript type check
        if (!paramInfo.name) return

        // When no parameter is supplied to the program ->
        if (!programArgs.params.length) {
            // Validation 1: Parameter configuration must have default value when no param is passed from cli
            if (paramInfo.required && typeof paramInfo.value == 'undefined') {
                throw new RuntimeError('Required parameter missing', paramInfo.name)
            }
            continue
        }

        // when parameters are supplied ->

        // Set default value if present
        mappedParams[paramInfo.name] = paramInfo.value || ''

        // get single value
        if (paramInfo.type == ParamType.SINGLE) {
            mappedParams[paramInfo.name] = programArgs.params[currentParamListIdx]
            currentParamListIdx++
        }

        // get list of values
        if (paramInfo.type == ParamType.LIST) {
            mappedParams[paramInfo.name] = programArgs.params.slice(currentParamListIdx)
            currentParamListIdx = programArgs.params.length
        }

        // Validation 1: Parameter must have value when param is required
        if (paramInfo.required && !mappedParams[paramInfo.name]) {
            throw new RuntimeError('Required parameter missing', paramInfo.name)
        }

        // getting allowed value
        mappedParams[paramInfo.name] = getAllowedValue(programArgs.params[currentParamListIdx], paramInfo)
    }
    return mappedParams
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
    readArgs()

    // Show program help when no arguments are passed AND when any of nested condition is true
    if (!suppliedArgs.length) {

        // Program is running in command mode
        // AND 'showHelpOnNoCommand' is enabled
        if (GlobalSettings.enableCommands() && GlobalSettings.showHelpOnNoCommand()) {
            return Help.program(program.config)
        }

        // Program is running in no-command mode
        // AND program params doesn't contain any required param
        if (!GlobalSettings.enableCommands() && program.config.params.containsRequired()) {
            return Help.program(program.config)
        }
    }

    // 2. Handle global options

    // 2a. Show program or command help when --help option is supplied
    if (GlobalSettings.enableHelpOption() && programArgs.containsOption(['help', 'h'])) {
        return Help.command(program.config, programArgs.commandName)
    }

    // 2b. Show program version when --version option is supplied
    if (GlobalSettings.enableVersionOption() && programArgs.containsOption(['version', 'ver', 'v'])) {
        return Help.version(program.config)
    }

    // 3. Handle Program Options

    // 3a. create program options map
    var programOptions = {}
    try {
        programOptions = await createOptionsMap(program.config.options)
    }
    catch (ex) {
        // Show program help when there is a runtime error reading program options AND
        // global setting showHelpOnInvalidOptions is set
        if (GlobalSettings.showHelpOnInvalidOptions()) {
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
    if (Object.keys(programOptions).length > 1 && GlobalSettings.enableCommands() && (!programArgs.commandName || GlobalSettings.prioritizeProgramOptions() === true)) {
        return callback(program, 'onProgramOption', await createParamsMap(), programOptions)
    }
    // 3c. otherwise treat all options as command options and pass to command method

    // 4. Handle Program's no-Command mode
    if (!GlobalSettings.enableCommands()) {
        try {
            // 4a. create param map for program
            var programParams = await createParamsMap(program.config.params)

            // 4b. call program's main method
            return callback(program, GlobalSettings.mainMethod(), programParams, programOptions)
        } catch (ex) {

            // Showing command help
            if (GlobalSettings.showHelpOnInvalidParams()) {
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
    if (!reqCommandName && GlobalSettings.showHelpOnNoCommand()) {
        return Help.program(program.config)
    }

    // otherwise run command
    return runCommand(program, reqCommandName)
}

/** Runs a program command */
export async function runCommand(program: any, reqCommandName: string) {
    commandIteration++

    // Show command help when command name is 'help'
    if (reqCommandName == 'help' && GlobalSettings.enableHelpCommand()) {
        return Help.program(program.config)
    }

    // Get command definition object for the requested command name
    var command = program.config.commands.getByName(reqCommandName)

    // Handle invalid command / command not found
    if (!command) {
        // show help if enabled
        if (GlobalSettings.showHelpOnNoCommand()) {
            return Help.program(program.config)
        }

        // otherwise if maxCommandIteration is not reached, call onInvalidCommand methods
        if (commandIteration <= maxCommandIteration) {
            return callback(program, 'onInvalidCommand', reqCommandName, await createParamsMap(), await createOptionsMap())
        }

        // finally show program help
        return Help.program(program.config)
    }

    // otherwise, proceed further to execute the command

    // create command params map object
    var params: any = {}
    try {
        params = await createParamsMap(command.params)
    }
    catch (ex) {
        // show help if enabled
        if (GlobalSettings.showHelpOnInvalidParams()) {
            return Help.command(program.config, reqCommandName)
        }

        // Otherwise re-throwing exception
        throw ex
    }

    // create command options map object
    var options = {}
    try {
        options = await createOptionsMap(command.options)
    }
    catch (ex) {
        // Show command help if enabled
        if (GlobalSettings.showHelpOnInvalidOptions()) {
            return Help.command(program.config, reqCommandName)
        }

        // Otherwise re-throwing exception
        throw ex
    }

    // finally execute the command
    return callback(program, command.methodName, params, options)

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