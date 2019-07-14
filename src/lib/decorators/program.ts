import { ProgramConfiguration } from '../program-config'
import { IProgramInfo } from '../types/info-objects'

/**
 * Creates decorator for program class
 * Decorator updates the program information to the program configuration object and
 * Runs the program
 */
export function programDecoratorFactory(programInfo?: IProgramInfo) {
    return function (targetConstructor: any) {

        // Updating program description
        if (programInfo) {
            let config: ProgramConfiguration = ProgramConfiguration.injectConfiguration(targetConstructor.prototype)
            config.merge(programInfo)

            // Running Program
            if (programInfo.autorun !== false) {
                new targetConstructor().run()
            }
        }

    }
}