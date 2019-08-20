import { Config, IConfig } from './base-config'
import { Collection } from './collection'
import { ConfigurationError } from '../errors/config-error'
import { camelCase, hyphenate } from '../utility/string'
import { getParameters } from '../utility/reflection'

/** Types of Command Params */
export enum ParamType {
    SINGLE = 'single', // accepts single value (default)
    LIST = 'list' // accepts list of values for command Param
}

/** Shape of the Parameter Configuration */
export interface IParamConfig extends IConfig {
    type?: ParamType // whether to accept single or a list of values, default should singles
    required?: boolean // default should be false
    // values that are accepted for the param 
    acceptOnly?: string[]
    // default value, must be one of accepted values
    value?: string
}

export class Param extends Config implements IParamConfig {
    public type: ParamType = ParamType.SINGLE
    public required = false
    public acceptOnly: string[] = []
    public value: string = ''
    /** parameter index in command or main method signature */
    public $idx: number = -1

    constructor(config: IParamConfig) {
        super(config)
        this.name = hyphenate(config.name)
        this.type = config.type || this.type
        this.value = config.value || ''
        this.acceptOnly = Array.isArray(config.acceptOnly) ? config.acceptOnly : []
        this.required = !!config.required

        // removing duplicate values
        this.acceptOnly = this.acceptOnly.filter((value, index, self) => self.indexOf(value) === index)
    }

    /** creates param object from any object that has required fields */
    static createFromAny(config: any) {
        return new Param({
            name: config.name || '',
            required: config.required,
            type: config.type,
            help: config.help,
            value: config.value,
            acceptOnly: config.acceptOnly,
            propName: config.propName
        })
    }
}

/** Represents collection of params */
export class ParamCollection extends Collection<Param>{

    private _listParam: string = ''
    private _optionalParam: string = ''
    private _requiredParam: string = ''
    private _propNames: any = {}
    public indexParamsParam: number = -1
    public indexOptionsParam: number = -1

    addByConfig(configs: IParamConfig | IParamConfig[]) {
        if (this.length) throw new ConfigurationError('Unable to initialize collection with properties names. Collection not empty!')
        if (!Array.isArray(configs)) configs = [configs]
        configs.forEach(config => {
            var param = new Param(config)
            super.append(param.name, new Param(config))
        })
    }

    /** adds parameters by properties if collection is empty, otherwise throws error */
    initByProperties(propertyNames: string[], saveIndex?: boolean) {
        if (!propertyNames || !propertyNames.length) return
        if (this.length) throw new ConfigurationError('Unable to initialize collection with properties names. Collection not empty!')
        for (var idx = 0; idx < propertyNames.length; idx++) {

            var propName = propertyNames[idx]
            var paramConfig: IParamConfig = { name: '' }

            // get index for params paramter
            if (propName == '$params') {
                this.indexParamsParam = idx
                continue
            }

            // get index for options paramter
            if (propName == '$options') {
                this.indexOptionsParam = idx
                continue
            }

            // check for ...
            if (propName.startsWith('.')) {
                propName = propName.replace('...', '')
                paramConfig.type = ParamType.LIST
            }

            // add
            paramConfig.name = hyphenate(propName)
            paramConfig.propName = propName

            // assign index
            var param = new Param(paramConfig)
            param.$idx = idx

            super.append(param.name, param)
        }
    }

    /** adds parameters by the names of the parameters in the method signature */
    initByMethod(methodSignature: any) {
        if (methodSignature && typeof methodSignature == 'function') {
            this.initByProperties(getParameters(methodSignature))
        }
    }
    /** merges or appends a param in the collection */
    mergeByConfigs(configs: IParamConfig[]) {
        if (!configs) throw new ConfigurationError('Unable to merge parameter, configuration is null or undefined')
        if (!Array.isArray(configs)) throw new ConfigurationError('Unable to merge parameter, configuration is not an array')
        if (!configs.length) return
        // parameters are mapped with the supplied arguments from left to right order
        // therefore to maintain the order of parameters, parameters must be merged with
        // same order i.e. param at index 0 in the new config list must be merged to the
        // index 0 parameter in the collection

        // if the list of configs is shorter then existing collection, merge should take place
        // for parameters up to the length of the new list, remaining should remain un-affected

        // if the list bigger, new parameters must be added to the collection

        var existingParams = this.toArray()
        this.clear()
        for (var idx = 0; idx < configs.length; idx++) {
            var param: Param = existingParams[idx]
            var config = configs[idx]
            if (param) {
                // do not allow property name change if $idx is present
                if (param.$idx > -1 && config.propName && param.propName != config.propName) {
                    throw new ConfigurationError("Unable to merge. Cannot change property name for auto-generated params", config)
                }
                // merging all non-empty properties except $idx
                param.merge(config, { ignoreProps: ['$idx'] })
                // merging name if present
                param.name = config.name || param.name
            } else {
                param = new Param(config)
            }
            super.append(param.name, param)
        }
        // adding remaining params
        if (configs.length < existingParams.length) {
            for (var i = configs.length; i < existingParams.length; i++) {
                super.append(existingParams[i].name, existingParams[i])
            }
        }
    }

    /** creates or merges a config as param in the collection */
    merge(config: IParamConfig) {
        if (!config) throw new ConfigurationError('Parameter configuration cannot be null or undefined')

        // Check if param already exists
        if (super.hasKey(config.name)) {
            // merge if exists
            var param = super.get(config.name)
            param.merge(config)
            super.update(param.name, param)
        } else {
            // add new if not exists
            var param = new Param(config)
            super.append(param.name, param)
        }
    }

    clear() {
        super.clear()
        this._listParam = ''
        this._optionalParam = ''
        this._requiredParam = ''
        this._propNames = {}
        this.indexParamsParam = -1
        this.indexOptionsParam = -1
    }

    protected validate(item: Param) {

        // Rule 1. Param must have a name
        // Name validation done by base class, by this point paramInfo will have a name

        // Rule 2. Only one parameter can be of a list type
        // check item type is single and whether list type is already defined and not for current param
        if (this._listParam && this._listParam != item.name) {
            throw new ConfigurationError('List type parameter already defined.', item)
        }

        // Rule 3. Required parameter cannot come after optional parameter
        if (item.required && this._optionalParam && this._optionalParam != item.name) {
            throw new ConfigurationError('Required Parameter cannot be defined after optional parameter(s).', item)
        }

        // Rule 4. Property name must not be already used
        if (this._propNames[item.propName] && this._propNames[item.propName] != item.name) {
            throw new ConfigurationError('Unable to add param, param has a property name that is already used', item)
        }
    }

    protected itemAdded(item: Param) {
        // set param name for list param
        this._listParam = item.type == ParamType.LIST ? item.name : this._listParam

        // set param name for optional param
        this._optionalParam = !item.required ? item.name : this._optionalParam

        // set param name for required param
        if (item.required) {
            this._requiredParam = item.name
        }

        // add property name to the defined property name list
        this._propNames[item.propName] = item.name
    }

    /** Return true if there is any required parameter in the list */
    public containsRequired() {
        return this._requiredParam
    }

}

