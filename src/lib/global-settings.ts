
// Default program event names
var _programEvents = ['onInvalidCommand', 'onExit', 'onProgramOption']

// Type for rejection handler method
interface RejectionHandlerType { (reason: string, promise?: any): void }

// Objects to store global settings
const settingStore: any = {

    //
    // Common Properties

    // rejection handler method for process.onunhandledrejection event
    rejectionHandler: (reason: string, promise?: any) => { },

    // start index from where cli argument parser starts reading the arguments from cli
    processArgvStartIndex: 2,

    // options for cli argument parsr, minimist
    minimistOptionsObject: null,

    // flag to enable/disable global help option
    helpOptionEnabled: true,

    // flag to enable/disable global version option
    versionOptionEnabled: true,

    //
    // Command mode related

    // flgag to enable/disable program commands
    programCommandsEnabled: true,

    // flag to enable/disabled default help command
    helpCommandEnabled: true,

    // flag to show program help on invalid command
    showHelpOnInvalidCommand: true,

    // flag to show help on no command
    showHelpOnNoCommand: true,

    // flag to show help on invalid parameter, like required param missing, wrong value for choice etc.
    showHelpOnInvalidParams: true,

    // name of the default command, when no command is specified
    defaultCommandMethod: 'defaultCommand',

    // list of method names to not ignore as command methods
    noCommandMethodList: Array.from(_programEvents),

    // flag to priortize program options, i.e. call 'onProgramOption' even when command has options
    programOptionsPrioritized: false,

    //
    // No-Command mode related

    // name of the main method to call  
    mainMethod: "main"
}

// Sealing settings object
Object.seal(settingStore)

/** Abstract class with methods to set/get global settings */
export abstract class GlobalSettings {

    //
    // Common Properties

    /** Gets/sets global rejection handler for 'unhandledRejection' event of the proccess */
    static rejectionHandler(handler?: RejectionHandlerType): void | RejectionHandlerType {
        if (typeof handler == "undefined") return settingStore.rejectionHandler
        if (typeof handler == "function") {
            settingStore.rejectionHandler = handler
        }
    }

    /** Gets/sets index from where minimist should start parsing command line arguments */
    static processArgvStartIndex(index?: number) {
        if (typeof index == "undefined") {
            return settingStore.processArgvStartIndex
        }
        if (!isNaN(index)) {
            settingStore.processArgvStartIndex = Number(index)
        }
    }

    /** Gets/sets minimist cli parser's options */
    static minimistOptionsObject(options?: any) {
        if (typeof options == "undefined") {
            return settingStore.minimistOptionsObject
        }
        if (typeof options == "object") {
            settingStore.minimistOptionsObject = options
        }
    }

    /** Gets/sets flag to enable global help option '--help, -h' */
    static enableHelpOption(enable?: boolean) {
        if (typeof enable == "undefined") {
            return settingStore.helpOptionEnabled
        }
        if (typeof enable == "boolean") {
            settingStore.helpOptionEnabled = enable
        }
    }

    /** Gets/sets flag to enable global version option '--version, v' */
    static enableVersionOption(enable?: boolean) {
        if (typeof enable == "undefined") {
            return settingStore.versionOptionEnabled
        }
        if (typeof enable == "boolean") {
            settingStore.versionOptionEnabled = enable
        }
    }

    /** Gets/sets flag to enable program commands */
    static enableCommands(enable?: boolean) {
        if (typeof enable == "undefined") {
            return settingStore.programCommandsEnabled
        }
        if (typeof enable == "boolean") {
            settingStore.programCommandsEnabled = enable
        }
    }

    /** Gets/sets flag to enable/disabled default help command */
    static enableHelpCommand(enable?: boolean) {
        if (typeof enable == "undefined") {
            return settingStore.helpCommandEnabled
        }
        if (typeof enable == "boolean") {
            settingStore.helpCommandEnabled = enable
        }
    }

    /** Gets/sets flag to show program help on invalid command */
    static showHelpOnInvalidCommand(enable?: boolean) {
        if (typeof enable == "undefined") {
            return settingStore.showHelpOnInvalidCommand
        }
        if (typeof enable == "boolean") {
            settingStore.showHelpOnInvalidCommand = enable
        }
    }

    /** Gets/sets flag to show help on no command */
    static showHelpOnNoCommand(enable?: boolean) {
        if (typeof enable == "undefined") {
            return settingStore.showHelpOnNoCommand
        }
        if (typeof enable == "boolean") {
            settingStore.showHelpOnNoCommand = enable
        }
    }

    /** Gets/sets flag to show help on invalid parameter, like required param missing, wrong value for choice etc. */
    static showHelpOnInvalidParams(enable?: boolean) {
        if (typeof enable == "undefined") {
            return settingStore.showHelpOnInvalidParams
        }
        if (typeof enable == "boolean") {
            settingStore.showHelpOnInvalidParams = enable
        }
    }

    /** Gets/sets name of the method to call when command name not specified */
    static defaultCommandMethod(name?: string) {
        if (typeof name == "undefined") {
            return settingStore.defaultCommandMethod
        }
        if (typeof name == "string") {
            settingStore.defaultCommandMethod = name
        }
    }
    /** Gets/sets list of method names to not ignore as command methods */
    static noCommandMethodList(names?: string[]) {
        if (typeof names == "undefined") {
            return settingStore.noCommandMethodList
        }
        if (names && Array.isArray(names) && names.length) {
            settingStore.noCommandMethodList = Array.from(_programEvents).concat(names)
        }
    }

    /** Gets/sets flag to priortize program options, i.e. call 'onProgramOption' even when command has options */
    static programOptionsPrioritized(enable?: boolean) {
        if (typeof enable == "undefined") {
            return settingStore.abc
        }
        if (typeof enable == "boolean") {
            settingStore.abc = enable
        }
    }

    //
    // No-Command mode related

    /** Gets/sets name of the main method to call */
    static mainMethod(name?: string) {
        if (typeof name == "undefined") {
            return settingStore.mainMethod
        }
        if (typeof name == "string") {
            settingStore.mainMethod = name
        }
    }
}