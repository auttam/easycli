import { ConfigurationError } from '../errors/config-error'
import { mergeTypeSafe, IMergeOptions } from '../utility/reflection'
import { camelCase } from '../utility/string'

/** Shape of a Configuration Object */
export interface IConfig {
    /** name of the entity */
    name: string

    /** help text for the entity */
    help?: string

    /** name of the property to get the value */
    propName?: string
}

/** Represents Config */
export abstract class Config implements IConfig {
    public name: string = ''
    public help: string = ''
    public propName: string = ''

    constructor(config: IConfig) {
        // checking for option name
        if (!config.name) throw new ConfigurationError('Option configuration must have name', config)

        this.name = config.name
        this.help = config.help || ''
        this.propName = config.propName || camelCase(this.name)
    }

    merge(config: any, options?: IMergeOptions) {
        if (!config) return
        var name = this.name
        mergeTypeSafe(this, config, options)
        this.name = name
    }

    toConfig() {
        return {
            name: this.name,
            help: this.help,
            propName: this.propName
        }
    }
}