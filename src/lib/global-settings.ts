// Global Settings Objects
export const GlobalSettings = {
    defaultCommandMethod: 'defaultCommand',
    showHelpOnInvalidCommand: true,
    showHelpOnNoCommand: true,
    showHelpOnInvalidParams: true,
    enableHelpOption: true,
    enableHelpCommand: true,
    enableVersionOption: true,
    prioritizeProgramOptions: false,
    rejectionHandler: (reason: string, promise?: any) => { },
    processArgvStartIndex: 2,
    minimistOptions: null
}

// Sealing settings object
Object.seal(GlobalSettings)

export abstract class SettingInterface {

    /** Name of the method to call when command name not specified */
    public static set defaultCommandMethod(value: string) {
        if (typeof value == 'string') {
            GlobalSettings.defaultCommandMethod = value
        }
    }
    public static get defaultCommandMethod() {
        return GlobalSettings.defaultCommandMethod
    }

    // GlobalSettings.showHelpOnInvalidCommand
    public static set showHelpOnInvalidCommand(value: boolean) {
        if (typeof value == 'boolean') {
            GlobalSettings.showHelpOnInvalidCommand = value
        }
    }
    public static get showHelpOnInvalidCommand() {
        return GlobalSettings.showHelpOnInvalidCommand
    }

    // GlobalSettings.showHelpOnNoCommand
    public static set showHelpOnNoCommand(value: boolean) {
        if (typeof value == 'boolean') {
            GlobalSettings.showHelpOnNoCommand = value
        }
    }
    public static get showHelpOnNoCommand() {
        return GlobalSettings.showHelpOnNoCommand
    }

    // GlobalSettings.showHelpOnInvalidParams
    public static set showHelpOnInvalidParams(value: boolean) {
        if (typeof value == 'boolean') {
            GlobalSettings.showHelpOnInvalidParams = value
        }
    }
    public static get showHelpOnInvalidParams() {
        return GlobalSettings.showHelpOnInvalidParams
    }

    // GlobalSettings.enableHelpOption
    public static set enableHelpOption(value: boolean) {
        if (typeof value == 'boolean') {
            GlobalSettings.enableHelpOption = value
        }
    }
    public static get enableHelpOption() {
        return GlobalSettings.enableHelpOption
    }

    // GlobalSettings.enableHelpCommand
    public static set enableHelpCommand(value: boolean) {
        if (typeof value == 'boolean') {
            GlobalSettings.enableHelpCommand = value
        }
    }
    public static get enableHelpCommand() {
        return GlobalSettings.enableHelpCommand
    }

    // GlobalSettings.enableVersionOption
    public static set enableVersionOption(value: boolean) {
        if (typeof value == 'boolean') {
            GlobalSettings.enableVersionOption = value
        }
    }
    public static get enableVersionOption() {
        return GlobalSettings.enableVersionOption
    }

    // GlobalSettings.prioritizeProgramOptions
    public static set prioritizeProgramOption(value: boolean) {
        if (typeof value == 'boolean') {
            GlobalSettings.prioritizeProgramOptions = value
        }
    }
    public static get prioritizeProgramOption() {
        return GlobalSettings.prioritizeProgramOptions
    }

    // GlobalSettings.rejectionHandler
    public static set rejectionHandler(value: any) {
        if (typeof value == 'function') {
            GlobalSettings.rejectionHandler = value
        }
    }
    public static get rejectionHandler() {
        return GlobalSettings.rejectionHandler
    }

    /** Index from where minimist should start parsing command line arguments */
    public static set processArgvStartIndex(value: number) {
        if (typeof value == 'number') {
            GlobalSettings.processArgvStartIndex = value
        }
    }
    public static get processArgvStartIndex() {
        return GlobalSettings.processArgvStartIndex
    }

    /** Options for command line parser */
    public static set minimistOptions(value: any) {
        if (typeof value == 'function') {
            GlobalSettings.minimistOptions = value
        }
    }
    public static get minimistOptions() {
        return GlobalSettings.minimistOptions
    }
}