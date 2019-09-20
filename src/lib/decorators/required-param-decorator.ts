import { ProgramConfiguration } from '../config/program-config'
import { SettingStore } from '../settings'
import { command } from '../help';
import { ConfigurationError } from '../errors/config-error';
import { Command } from '../config/command-config';
export function required(target: any, propertyKey: string | symbol, parameterIndex: number) {

    // nothing to do if commands mode is disabled
    if (!SettingStore.enableCommands) return
    
    if (!target || typeof propertyKey != 'string' || typeof target[propertyKey] != 'function') {
        throw new ConfigurationError("There was some problem applying @required decorator")
    }

    var config = ProgramConfiguration.injectConfiguration(target)
    config.decoratorsEnabled = true
    var command = config.commands.get(propertyKey)
    if (!command) {
        command = new Command({
            method: propertyKey
        })
        // reading params by method signature
        command.params.initByMethod(target[propertyKey])
    }

    // marking parameter required
    command.params.toArray()[parameterIndex].required = true

    // Adding/updating command
    config.commands.addByCommand(command)
}