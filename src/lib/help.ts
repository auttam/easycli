import { EOL } from 'os'
import { IProgramConfig, ProgramConfiguration } from './config/program-config'
import { SettingStore } from './settings'
import { RuntimeError } from './errors/runtime-error'
import { Command, CommandCollection } from './config/command-config'
import { OptionCollection } from './config/option-config'
import { ParamCollection } from './config/param-config'
const stringWidth = require('string-width')

var defaultLeftIndent = 3
var defaultRightIndent = 3

// Color and formatting constants
const BOLD = '\u001b[1m'
const RESET = '\u001b[0m'
const UNDERLINE = '\u001b[4m'

//
// Help Printers

function boldText(text: string) {
    if (!SettingStore.useColors) return text
    return BOLD + text + RESET
}

function underlineText(text: string) {
    if (!SettingStore.useColors) return text
    return UNDERLINE + text + RESET
}

function underlinedBoldText(text: string) {
    if (!SettingStore.useColors) return text
    return BOLD + UNDERLINE + text + RESET

}

function padString(target: string, width: number) {
    if (!width || isNaN(width) || width < target.length) return target
    return target + ' '.repeat(width - target.length)
}

function getWidth(...target: string[]): number {
    var width = 0
    if (!target) return width
    target.forEach(str => width += stringWidth(str))
    return width
}

function wrap(width: number, prefix: string, ...strings: string[]) {
    var target = strings.join(' ')
    if (getWidth(prefix, target, EOL) < width) {
        return [prefix + target]
    } else {
        var words = target.split(/\s/g)
        target = prefix
        var initialWidth = target.length + EOL.length
        for (var idx = 0; idx < words.length; idx++) {
            var wordLen = getWidth(words[idx])
            if (wordLen + initialWidth < width) {
                target += words[idx] + ' '
                initialWidth += wordLen
            } else {
                return [target, words.slice(idx).join(' ')]
            }
        }

        return [target]
    }

    return [prefix, target]
}

function printColumnar(columnCollection: string[][], options: { colWidth: number, leftIndent: number, rightIndent: number } = { colWidth: 10, leftIndent: defaultLeftIndent, rightIndent: defaultRightIndent }) {
    if (!columnCollection || !columnCollection.length) return

    // Preparing options
    options = options || {}

    // preparing left indent string if specified
    options.leftIndent = Number(options.leftIndent || 0)
    options.leftIndent = isNaN(options.leftIndent || 0) ? 0 : options.leftIndent
    var strLeftIndent = options.leftIndent ? ' '.repeat(options.leftIndent) : ''

    // preparing right indent string if specified
    var strRightIndent = options.rightIndent ? ' '.repeat(options.rightIndent) : ''
    options.rightIndent = Number(options.rightIndent || 0)
    options.rightIndent = isNaN(options.rightIndent) ? 0 : options.rightIndent

    // calculating first column width
    options.colWidth = Number(options.colWidth) || 0

    // calculating maximum chars that can be printed in on console
    var maxStringSize = (process.stdout.columns || 80) - (options.leftIndent + options.rightIndent + 5)

    // calculating width of first column
    var firstColWidth = 0

    columnCollection.forEach(pair => {
        if (pair && pair[0].length > firstColWidth) firstColWidth = pair[0].length
    })

    if (options.colWidth > firstColWidth) {
        firstColWidth = options.colWidth
    }

    firstColWidth += options.rightIndent

    // printing columns for each lines in column collection
    while (columnCollection.length) {
        var pair = columnCollection.shift() || []
        var firstCol = (pair.shift() || '').trim()
        var secondCol: any = pair.join(' ')

        var wrapped = wrap(maxStringSize, padString(strLeftIndent + firstCol, firstColWidth) + strRightIndent, secondCol)

        // printing first line
        console.log(wrapped[0])

        // adding wrapped text back to the collection, to be handled in next iteration
        if (wrapped[1]) {
            columnCollection.unshift(['', wrapped[1]])
        }
    }
}

/** Prints program information */
function printProgramInfo(programInfo: IProgramConfig) {
    // Program Name
    console.log()
    console.log(boldText(`${programInfo.name} v${programInfo.version}`))

    // Program help
    if (programInfo.help) {
        console.log()
        console.log(programInfo.help)
    }
}

/** Prints program usage */
function printProgramUsage(config: ProgramConfiguration) {
    console.log()
    var label = 'Usage: ' //BOLD + UNDERLINE + 'Usage: ' + RESET
    if (SettingStore.enableCommands) {
        console.log(label + config.binaryName + (config.commands.length ? ' <command>' : '') + (config.options.length ? ' [options ...]' : ''))
    } else {
        var usage = label + config.binaryName
        if (config.params.length) {
            if (config.params.length == 1) {
                usage += ' <' + Array.from(config.params.getItems())[0].name + '>'
            } else {
                usage += ' [params ...]'
            }
        }
        if (config.options.length) {
            usage += ' [options ...]'
        }
        console.log(usage)
    }
}

/** Prints command list */
function printCommandList(config: ProgramConfiguration, commands: CommandCollection) {
    console.log()
    console.log(underlinedBoldText('Available Commands:'))
    console.log()

    var columnCollection = []
    for (var command of commands.getItems()) {
        columnCollection.push([command.name, command.help])
    }

    // printing command list
    printColumnar(columnCollection)
}

/** Prints options list*/
function printOptionList(options: OptionCollection) {
    if (!options.length) return
    console.log()
    console.log(underlinedBoldText('Options:'))
    console.log()

    var columnCollection = []
    for (var option of options.getItems()) {
        var optionInfo = '--' + option.name
        columnCollection.push(['--' + option.name, option.help || ''])
        if (option.aliases && Array.isArray(option.aliases) && option.aliases.length) {
            var aliases = option.aliases.map(name => (name.length == 1 ? '-' + name : '--' + name)).join(', ')
            columnCollection.push(['', boldText('Other Names: ') + aliases])
        }
    }
    // printing command list
    printColumnar(columnCollection)
}

/** Print Param list */
function printParamsList(params: ParamCollection) {
    if (!params || !params.length) return

    console.log()
    console.log(boldText('Parameters:'))
    console.log()
    var columnCollection = []
    for (var param of params.getItems()) {
        var desc = param.help || ''
        desc += param.required ? ' ' + boldText('(required)') : ''
        columnCollection.push([param.name || '', desc])

        if (param.acceptOnly && param.acceptOnly.length) {
            columnCollection.push(['', boldText('Accepted Values: ') + param.acceptOnly.join(', ')])
        }

    }

    // printing param help
    printColumnar(columnCollection)
}

function printCommandUsage(config: ProgramConfiguration, command: Command) {
    console.log()
    console.log(command.help)

    var usage = 'Usage: ' + config.binaryName + ' ' + command.name
    if (command.params.length) {
        usage += ' [param ...]'
    }
    if (command.options.length) {
        usage += ' [options ...]'
    }
    console.log()
    console.log(usage)
}

/** Prints complete program help */
function programHelp(config: ProgramConfiguration) {

    // print program info
    printProgramInfo(config.toConfig())

    // print program usage
    printProgramUsage(config)
    var commandHelpHint = ''

    if (SettingStore.enableCommands) {
        // print command list
        if (config.commands.length) {
            printCommandList(config, config.commands)
            commandHelpHint = '\nSee command help for more options'
        }
    } else {
        if (config.params.length) {
            printParamsList(config.params)
        }
    }

    // print program options
    if (config.options.length) {
        printOptionList(config.options)
    }

    if (commandHelpHint) {
        console.log(commandHelpHint)
    }

    // print global help and options
    var globalHelp = []

    // global help options
    if (SettingStore.enableHelpCommand) {
        globalHelp.push([config.binaryName + ' --help, -h', 'To view help'])
        if (config.commands.length && SettingStore.enableCommands) {
            globalHelp.push([config.binaryName + ' <command> --help, -h', 'To view command help'])
        }
    }

    // global version option
    if (SettingStore.enableVersionOption) {
        globalHelp.push([config.binaryName + ' --version, -v', 'To view help'])
    }

    // help command
    if (SettingStore.enableHelpCommand && SettingStore.enableCommands) {
        globalHelp.push([config.binaryName + ' help', 'To view help'])
    }

    if (globalHelp && globalHelp.length) {
        console.log()
        console.log('Other usage:')
        console.log()
        printColumnar(globalHelp)
    }

}

function commandHelp(config: ProgramConfiguration, commandName?: string) {
    if (!commandName) return

    // Getting command from collection
    var command = config.commands.getByName(commandName)

    if (!command) return

    // print command usage
    printCommandUsage(config, command)

    // print params
    if (command.params.length) {
        printParamsList(command.params)
    }

    // print options
    if (command.options.length) {
        printOptionList(command.options)
    }
}

/** Prints Program or Command help on console */
function print(config: any, commandName?: string) {
    if (!config) throw new RuntimeError('Configuration object is null or undefined, help cannot be printed')

    // Show command help, If command name is present 
    if (commandName) {
        if (commandName.toLowerCase() == 'help') {
            return programHelp(config)
        }
        return commandHelp(config, commandName)
    }

    // Otherwise show program help
    else {
        return programHelp(config)
    }
}

/** Prints Program help on console */
export function program(config: any) {
    print(config)
}

/** Prints command help on console */
export function command(config: any, name: string) {
    print(config, name)
}

/** Prints version info */
export function version(config: any) {
    console.log()
    console.log(config.name + ' v' + config.version)
}