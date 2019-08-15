import { mergeTypeSafe } from "./utility/reflection";

// Default program event names
var _programEvents = ['onInvalidCommand', 'onExit', 'onProgramOption']

var _noCommandMethods: string[] = []
var _defaultCommand: string = 'defaultCommand'

// Type for rejection handler method
interface RejectionHandlerType { (reason: string, promise?: any): void }

// Objects to store global settings
interface ISettings {
    mainMethod?: string
    rejectionHandler?: RejectionHandlerType,
    processArgvStartIndex?: number,
    minimistOptions?: any,
    commandsEnabled?: boolean,
    nonCmdMethods?: string[],
    defaultCommandMethod?: string
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
    commandsEnabled: false,

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