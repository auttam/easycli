import { ICommandDefinition } from './types'
import { ProgramConfiguration } from '../config/program-config'
import { Command } from '../config/command-config'
import { ConfigurationError } from '../errors/config-error';
import { hyphenate } from '../utility/string'
import { SettingStore } from '../settings'


/**
 * Program Command Decorator
 * decorates a class method as program command 
 * @param {object} commandDefinition command definition object
 */
export function commandDecoratorFactory(commandDefinition?: ICommandDefinition) {
    return function (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) {

        // nothing to do if commands mode is disabled
        if (!SettingStore.enableCommands) return

        // getting program configuration object
        var config = ProgramConfiguration.injectConfiguration(target)

        if (!commandDefinition) {
            commandDefinition = {}
        }

        var command: Command = config.commands.get(propertyName)
        if (!command) {
            command = new Command({
                name: commandDefinition.name,
                method: propertyName,
                help: commandDefinition.help
            })
        }

        // merging parameters
        if (commandDefinition.params && commandDefinition.params.length) {
            commandDefinition.params.forEach(definition => {
                // throw error if definition has a different property name
                // for already existing (auto-generated) param 
                if (definition.propName && definition.name) {
                    var param = command.params.get(hyphenate(definition.name))
                    if (param && param.propName != definition.propName) {
                        throw new ConfigurationError('Parameter property name doesn\'t match with method parameter', definition)
                    }
                }
                command.params.addByAny(definition)
            })
        }

        // merging options
        if (commandDefinition.options && commandDefinition.options.length) {
            commandDefinition.options.forEach(definition => {
                command.options.addByAny(definition)
            })
        }

        // Adding/updating command
        config.commands.addByCommand(command)
    }
}
