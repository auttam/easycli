import { Config, IConfig } from './base-config'
import { Collection } from './collection'
import { ConfigurationError } from '../errors/config-error'

/** Shape of the Option Configuration */
export interface IOptionConfig extends IConfig {
    // other names for the option
    aliases?: string[]
    // values that are accepted for the option 
    acceptOnly?: string[]
    // default value, must be one of accepted values
    value?: string | number | boolean
}

/** Represents an Option */
export class Option extends Config implements IOptionConfig {

    public acceptOnly: string[] = []
    public value: undefined | string | number | boolean
    public aliases: string[] = []

    constructor(config: IOptionConfig) {
        super(config)

        if (config.value) {
            this.value = config.value
        }
        this.acceptOnly = Array.isArray(config.acceptOnly) ? config.acceptOnly : []
        this.aliases = config.aliases && Array.isArray(config.aliases) ? config.aliases : []

        // removing duplicate values
        this.acceptOnly = this.acceptOnly.filter((value, index, self) => self.indexOf(value) === index)

        // removing duplicate names
        this.aliases = this.aliases.filter((value, index, self) => self.indexOf(value) === index)

        // removing main option name from list of aliases 
        if (this.aliases.indexOf(this.name) > -1) {
            this.aliases = this.aliases.filter(item => item != this.name)
        }
    }
}

/** Represents collection of options */
export class OptionCollection extends Collection<Option>{

    // collection for property names
    private _propNames: any = {}
    private _names: string = ''

    /** Creates and adds option in the collection */
    public add(config: IOptionConfig) {
        if (!config) throw new ConfigurationError('Option configuration cannot be null or undefined')

        // Check if option already exists
        if (super.hasKey(config.name)) {
            // merge if exists
            var option = super.get(config.name)
            option.merge(config)
            super.update(option.name, option)
        } else {
            // add new if not exists
            var option = new Option(config)
            super.append(option.name, option)
        }
    }

    /** Creates and adds an array of options in the collection */
    public addList(configs?: IOptionConfig[]) {

        // return if list is empty or undefined
        if (!configs || !configs.length) return

        // adding options iteratively 
        configs.forEach(config => this.add(config))
    }

    public addByAny(config: any) {
        this.add({
            name: config.name || '',
            help: config.help,
            value: config.value,
            acceptOnly: config.acceptOnly,
            aliases: config.aliases,
            propName: config.name
        })
    }

    protected validate(item: Option) {

        // Rule 1. Option must have a name
        // Name validation done by base class, by this point item will have a name

        // Rule 2. Property name must not be already used
        if (this._propNames[item.propName] && this._propNames[item.propName] != item.name) {
            throw new ConfigurationError('Unable to add option, option has a property name that is already used', item)
        }

        // Rule 3. Names in 'Aliases' must not match with existing options names or their aliases
        var self = this
        var matched = item.aliases.some(name => {
            return self._names.indexOf(' ' + name + ' ') > -1
        })
        if (matched) {
            throw new ConfigurationError('Unable to add option, option has a name that is already used', item)
        }
    }

    protected itemAdded(item: Option) {
        // add option name to defined name list
        if (this._names.indexOf(item.name) == -1) {
            this._names += item.name + ' ' + item.aliases.join(' ') + ' '
        }

        // add property name to the defined property name list
        this._propNames[item.propName] = item.name
    }
}