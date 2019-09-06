import { SettingStore } from '../settings'
import { RuntimeContext, RuntimeStates } from './context'
import { ProgramConfiguration } from '../config/program-config'

/** flag: sets when unhandled rejection handler is attached to the process event */
var rejectionHandlerAttached = false

/** name of the property that stores context id in the program object */
const contextPropertyName = '__contextID'

/** Container storing created contexts by program's class names */
const contextContainer: { [key: string]: RuntimeContext } = {}

/** Attaches event handler once to process' unhandled rejection event */
export function handleRejections(handler: any) {
    if (handler && typeof handler == 'function' && !rejectionHandlerAttached) {
        process.on('unhandledRejection', handler)
        rejectionHandlerAttached = true
    }
}

/** Validates target to be be a program instance of same type as specified via type argument */
function validateProgram(target: any) {
    if (!target) {
        throw new TypeError('Unable to create runtime context, target program is null')
    }
    if (!target.constructor) {
        throw new TypeError('Unable to create runtime context, constructor is missing')
    }
    if (!target.constructor.name) {
        throw new TypeError('Unable to create runtime context, constructor name missing')
    }
    if (target.constructor.name == 'Program') {
        throw new TypeError('Unable to create runtime context, target program is not derived from Program Class')
    }
}

/** creates a context if not already created, checks if program is already running */
export function createContext(target: any, type: any): RuntimeContext {

    // validate target is a valid program of type as specified
    validateProgram(target)

    // validate target to be instance of class specified by type
    if ((target instanceof type) == false) {
        throw new TypeError('Unable to create runtime context, target program is not an instance of Program Class')
    }

    if (target.constructor[contextPropertyName]) {
        throw new TypeError('Unable to create runtime context, context already created')
    }

    // creating new context
    var context = new RuntimeContext(target)

    // stamping context id to target's constructor
    target.constructor[contextPropertyName] = target.constructor.name + context.contextId

    // adding context to context container
    contextContainer[target.constructor[contextPropertyName]] = context

    // returning context
    return context
}

/** gets context for the program **/
export function getContext(target: any) {
    // validate target is a valid program of type as specified
    validateProgram(target)

    if (!target.constructor[contextPropertyName]) {
        throw new TypeError('Unable to get execution context, context not created')
    }

    return contextContainer[target.constructor[contextPropertyName]]
}

/** runs a program */
export async function runProgram(program: any, context?: RuntimeContext) {

    // Attach handler to unhandled Rejections event
    handleRejections(SettingStore.rejectionHandler)

    // getting context for the program
    context = context || getContext(program)

    // 
    // Type checking

    // check if context is present
    if (!context) {
        throw new TypeError('Cannot run program, context missing')
    }

    // check if context belongs to program
    if (!program.constructor[contextPropertyName]
        || program.constructor[contextPropertyName].indexOf(context.contextId) < 0) {
        throw new TypeError('Cannot run program, context mismatch')
    }

    // check if a program is not in created state
    if (context.state != RuntimeStates.CREATED) {
        throw new TypeError('Cannot run program due to incorrect program state')
    }

    // check if program is missing configuration
    if (!program.config || !(program.config instanceof ProgramConfiguration)) {
        throw new SyntaxError('Cannot run program, configuration missing')
    }

    //
    // Program execution

    // [1]
    // initialize runtime context
    context.init()

    // [2]
    // handle global help 
    if (context.helpRequested) {
        return program.showHelp(context.requestedCommand)
    }
    // in case of SettingStore.enableHelpOption and/or SettingStore.enableHelpCommand set to false
    // --help option will be treated as command/program option and 'help' will be treated as command
    // or program parameter value

    // [3]
    // handle global version options (--version, --ver or -v) 
    if (context.versionRequested) {
        return program.showVersion()
    }

    // [4]
    // execute main() or command method
    var error, executionResult, exitCode = 0
    try {
        // execute program
        executionResult = await context.runProgram()
    } catch (err) {
        // Printing error
        if (typeof err == 'string') err = 'Error: ' + err
        console.error(err)

        // setting error as send back
        error = err
        exitCode = 1
    }

    // existing 
    return await context.exitProgram(error, executionResult, exitCode)
}