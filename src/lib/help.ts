import { RuntimeError } from './types/errors'
import { IProgramInfo, ICommandInfo } from './types/info-objects'
import { ProgramConfiguration } from './program-config'
import { Command, CommandCollection } from './types/collections/commands'
import { OptionCollection } from './types/collections/options'
import { ParamCollection } from './types/collections/params'
import { GlobalSettings } from './global-settings'
import { EOL } from 'os'
const stringWidth = require('string-width')

var defaultLeftIndent = 3
var defaultRightIndent = 3

//
// Help Printers

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
    var maxStringSize = (process.stdout.columns || 80) - (options.leftIndent + options.rightIndent)

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
function printProgramInfo(programInfo: IProgramInfo) {
    // Program Name
    console.log()
    console.log(`${programInfo.name} v${programInfo.version}`)

    // Program description
    if (programInfo.description) {
        console.log()
        console.log(programInfo.description)
    }
}

/** Prints program usage */
function printProgramUsage(config: ProgramConfiguration) {
    console.log()
    console.log('Usage: ' + config.binaryName + (config.hasRealCommand() ? ' <command>' : '') + (config.options.length ? ' [options ...]' : ''))
}

/** Prints command list */
function printCommandList(config: ProgramConfiguration, commands: CommandCollection) {
    console.log()
    console.log('Available Commands:')
    console.log()

    var columnCollection = []
    for (var command of commands.getItems()) {
        // no need to include default command if it has default method name
        if (command.methodName == GlobalSettings.defaultCommandMethod()) { continue }
        columnCollection.push([command.commandName, command.description])
    }

    // printing command list
    printColumnar(columnCollection)
}

/** Prints options list*/
function printOptionList(options: OptionCollection) {
    if (!options.length) return
    console.log()
    console.log('Options:')
    console.log()

    var columnCollection = []
    for (var option of options.getItems()) {
        var optionInfo = '--' + option.name
        columnCollection.push(['--' + option.name, option.description || ''])
        if (option.alias && Array.isArray(option.alias)) {
            columnCollection.push(['', 'Aliases: ' + option.alias.join(', ')])
        }
    }
    // printing command list
    printColumnar(columnCollection)
}

/** Print Param list */
function printParamsList(params: ParamCollection) {
    if (!params || !params.length) return

    console.log()
    console.log('Command Parameters:')
    console.log()
    var columnCollection = []
    for (var param of params.getItems()) {
        var desc = param.description || ''
        desc += param.required ? ' (required)' : ''
        columnCollection.push([param.name || '', desc])

        if (param.type == 'choice' && param.choices) {
            columnCollection.push(['', 'Possible Values: ' + param.choices.join(', ')])
        }

    }

    // printing param help
    printColumnar(columnCollection)
}

function printCommandUsage(config: ProgramConfiguration, command: Command) {
    console.log()
    console.log(command.description)

    var usage = 'Usage: ' + config.binaryName + ' ' + command.commandName
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
    printProgramInfo(config.getInfo())

    // print program usage
    printProgramUsage(config)

    // print command list
    if (config.hasRealCommand()) {
        printCommandList(config, config.commands)
    }

    // print program options
    if (config.options.length) {
        printOptionList(config.options)
    }

    // print global help and options
    var globalHelp = []

    // global help options
    if (GlobalSettings.helpCommandEnabled()) {
        globalHelp.push([config.binaryName + ' --help, -h', 'To view help'])
        if (config.hasRealCommand()) {
            globalHelp.push([config.binaryName + ' <command> --help, -h', 'To view command help'])
        }
    }

    // global version option
    if (GlobalSettings.versionOptionEnabled()) {
        globalHelp.push([config.binaryName + ' --version, -v', 'To view help'])
    }

    // help command
    if (GlobalSettings.helpCommandEnabled()) {
        globalHelp.push([config.binaryName + ' hep', 'To view help'])
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