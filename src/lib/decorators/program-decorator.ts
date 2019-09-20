import { ProgramConfiguration } from '../config/program-config'
import { IProgramDefinition } from './types'
import { RuntimeError } from '../errors/runtime-error'
import { ConfigurationError } from '../errors/config-error';

/**
 * Creates decorator for program class
 * Decorator updates the program information to the program configuration object and
 * Runs the program
 */
export function programDecoratorFactory(programDefinition?: IProgramDefinition, cbExecPromise?: (promise?: any) => any) {
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
                var params: any = programDefinition.params
                config.params.mergeByConfigs(params)

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

        // running program
        try {
            var progPromise = targetConstructor.run(new targetConstructor())

            // passing final promise to the caller
            if (typeof cbExecPromise == "function") {
                cbExecPromise(progPromise)
            }
        }
        catch (ex) {
            console.log(ex)
        }
    }
}