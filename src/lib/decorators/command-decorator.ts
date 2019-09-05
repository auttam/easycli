import { ICommandDefinition } from './types'
import { ProgramConfiguration } from '../config/program-config'
import { Command } from '../config/command-config'
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
            var params: any = commandDefinition.params
            command.params.mergeByConfigs(params)
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
