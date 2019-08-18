import { ProgramConfiguration } from '../config/program-config'
import { IProgramDefinition } from './types'
import { ConfigurationError } from '../errors/config-error'
import { RuntimeError } from '../errors/runtime-error'

/**
 * Creates decorator for program class
 * Decorator updates the program information to the program configuration object and
 * Runs the program
 */
export function programDecoratorFactory(programDefinition?: IProgramDefinition) {
    return function (targetConstructor: any) {

        // Updating program description
        if (programDefinition) {
            let config: ProgramConfiguration = ProgramConfiguration.injectConfiguration(targetConstructor.prototype)
            config.merge({
                name: programDefinition.name,
                help: programDefinition.help,
                binaryName: programDefinition.binaryName,
                version: programDefinition.version,
            })

            // merging parameters
            if (programDefinition.params && programDefinition.params.length) {
                programDefinition.params.forEach(definition => {
                    config.params.addByAny(definition)
                })
            }

            // merging options
            if (programDefinition.options && programDefinition.options.length) {
                programDefinition.options.forEach(definition => {
                    config.options.addByAny(definition)
                })
            }

            // Running Program
            if (programDefinition.autorun === false) {
                return
            }
        }

        // instancing program
        try {
            new targetConstructor().start()
        }
        catch (ex) {
            throw new RuntimeError('Error while running the program', ex)
        }
    }
}