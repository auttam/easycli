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
}

/** Represents collection of params */
export class ParamCollection extends Collection<Param>{

    private _listParam: string = ''
    private _optionalParam: string = ''
    private _requiredParam: string = ''
    private _propNames: any = {}
    public indexParamsParam: number = -1
    public indexOptionsParam: number = -1

    addByPropNames(propertyNames: string[]) {
        if (!propertyNames || !propertyNames.length) return
        for (var idx = 0; idx < propertyNames.length; idx++) {

            var propName = propertyNames[idx]
            var paramConfig: IParamConfig = { name: '' }

            // get index for params paramter
            if (propName == 'params') {
                this.indexParamsParam = idx
                continue
            }

            // get index for options paramter
            if (propName == 'options') {
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
            this.add(paramConfig)
        }
    }

    addBySignature(methodSignature: any) {
        if (methodSignature && typeof methodSignature == 'function') {
            this.addByPropNames(getParameters(methodSignature))
        }
    }

    addByAny(config: any) {
        this.add({
            name: config.name || '',
            required: config.required,
            type: config.type,
            help: config.help,
            value: config.value,
            acceptOnly: config.acceptOnly,
            propName: config.propName
        })
    }

    /** Creates and adds param in the collection */
    add(config: IParamConfig) {
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

    /** Creates and adds an array of params in the collection */
    public addList(configs?: IParamConfig[]) {

        // return if list is empty or undefined
        if (!configs || !configs.length) return

        // adding params iteratively 
        configs.forEach(config => this.add(config))
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

