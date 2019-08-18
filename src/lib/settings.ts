import { mergeTypeSafe } from "./utility/reflection";

// Default program event names
var _programEvents = ['onInvalidCommand', 'onExit', 'onProgramOption']

var _noCommandMethods: string[] = []
var _defaultCommand: string = 'defaultCommand'

// Type for rejection handler method
interface RejectionHandlerType { (reason: string, promise?: any): void }

// Objects to store global settings
export interface ISettings {
    /** name of the main method to call when program is running in no-command mode*/
    mainMethod?: string
    /** global rejection handler for 'unhandledRejection' event of the proccess */
    rejectionHandler?: RejectionHandlerType,
    /** index from where minimist should start parsing command line arguments */
    processArgvStartIndex?: number,
    /** options for minimist arguments parser */
    minimistOptions?: any,
    /** flag to enable program commands */
    enableCommands?: boolean,
    /** list of method names to ignore as command methods */
    nonCmdMethods?: string[],
    /** name of the method that is called when command name not supplied */
    defaultCommandMethod?: string,
    /** flag to enable global help command  */
    enableHelpCommand?: boolean,
    /** flag to enable global version option */
    enableVersionOption?: boolean,
    /** flag to show help when no command argument is supplied to the program */
    showHelpOnNoCommand?: boolean,
    /** flag to enable global help option */
    enableHelpOption?: boolean,
    /** flag to show help on invalid options i.e when value provided is not allowed */
    showHelpOnInvalidOptions?: boolean
    /** flag to prioritize program options, i.e. call 'onProgramOption' even when command has options */
    prioritizeProgramOptions?: boolean,
    /** flag to show help on invalid parameter, like required param missing, value provided is not allowed etc. */
    showHelpOnInvalidParams?: boolean
}

export const SettingStore: ISettings = {
    /** name of the main method to call when program is running in no-command mode*/
    mainMethod: "main",

    /** global rejection handler for 'unhandledRejection' event of the proccess */
    rejectionHandler: (reason: string, promise?: any) => { },

    /** index from where minimist should start parsing command line arguments */
    processArgvStartIndex: 2,

    /** options for minimist arguments parser */
    minimistOptions: null,

    /** flag to enable program commands */
    enableCommands: false,

    /** flag to enable global help command  */
    enableHelpCommand: true,

    /** flag to enable global version option */
    enableVersionOption: true,

    /** flag to enable global help option */
    enableHelpOption: true,

    /** flag to show help when no command argument is supplied to the program */
    showHelpOnNoCommand: true,

    showHelpOnInvalidOptions: true,

    prioritizeProgramOptions: false,

    showHelpOnInvalidParams: true,

    /** name of the method that is called when command name not supplied */
    set defaultCommandMethod(name: string) {
        if (!name) {
            name = 'defaultCommand'
        }
        _defaultCommand = name
    },

    get defaultCommandMethod() {
        return _defaultCommand
    },

    /** list of method names to ignore as command methods */
    set nonCmdMethods(list: string[]) {
        if (!Array.isArray(list) || !list.length) return
        _noCommandMethods = list
    },

    get nonCmdMethods() {
        return _noCommandMethods.concat(_programEvents)
    }
}

// Sealing settings object
Object.seal(SettingStore)

/** Updates settings  */
export function updateStore(settings: ISettings) {
    mergeTypeSafe(SettingStore, settings, { copyFunctions: true, throwTypeError: true, copyEmpty: true })
}