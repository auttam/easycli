import { ICommandInfo } from '../types/info-objects'
import { ProgramConfiguration } from '../program-config'

/**
 * Program Command Decorator
 * decorates a class method as program command 
 * @param {object} commandInfo command info object
 */
export function commandDecoratorFactory(commandInfo?: ICommandInfo) {
    return function (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) {

        // getting program configuration object
        var config = ProgramConfiguration.injectConfiguration(target)

        // creating command info if not specified
        if (!commandInfo) {
            commandInfo = { method: propertyName }
        }

        // Adding/updating command
        config.commands.add(commandInfo, true)
    }
}
