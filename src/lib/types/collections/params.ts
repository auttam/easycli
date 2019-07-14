import { Collection } from './base'
import { IParamInfo, ParamType } from '../info-objects'
import { ConfigurationError } from '../errors'
import { hyphenate, camelCase, getPropertyValue } from '../../utils'

/*
    Command Parameter
    -----------------
    Command Parameters are the rest of the cli arguments passed after command name. 
    A command may have any number of params.

    A command may accept any number of parameters. Parameter collection contains
    information of each parameter a command is configured to accept.

    Types of parameters
    
    There are 3 types of parameters named - (1) single, (2) list, and (3) choice parameter.

    A command may have a combination of any types of parameters. Following are some rules -
        1. There can be only one list type parameter
        2. When combining with other types, list param must the last param
        3. A required parameter cannot come after optional parameter

    The cli arguments are parsed as command params in the order they are stored in the collection.

    example of parameter determination --
    
    > easy-cli command arg1 arg2 arg3

    in the above example:
        
    if param collection contain 3 single type params named 'param1', 'param2' and 'param3' 
    then the above cli arguments will be parsed as: 
    
    param1=param, param2=arg2, and param3=arg3

    if the collection contains 1 list type param name 'param1' then the above cli arguments 
    will be parsed as: param1=['arg1', 'arg2', 'arg3']

*/

/**
 * Represents Collection of Command Parameters
 * @example
 * easy-cli <command-name> [param1, param2]
 */
export class ParamCollection extends Collection<IParamInfo>{

    private _containsListType: boolean = false
    private _optionalParamDefined: boolean = false

    /** Adds param to the collection */
    add(paramInfo: IParamInfo, update?: boolean) {

        if (!paramInfo) throw new ConfigurationError('Parameter cannot be null or undefined')

        // adding param
        // will throw error if name is empty, following is to bypass typescript error
        paramInfo.name = paramInfo.name || ''

        if (update) {
            super.update(paramInfo.name, paramInfo)
        }
        else {
            super.append(paramInfo.name, paramInfo)
        }

    }

    /** Adds a list of params*/
    public addList(paramList?: IParamInfo[], update?: boolean) {

        // return if list is empty or undefined
        if (!paramList || !paramList.length) return

        // adding params iteratively 
        paramList.forEach(paramInfo => this.add(paramInfo, update))
    }

    /** Setting up item before adding */
    protected setupItem(paramInfo: IParamInfo): IParamInfo {

        // hyphenating the name
        paramInfo.name = hyphenate(paramInfo.name || '')

        // adding default description
        paramInfo.description = paramInfo.description || 'No Description'

        // default type
        paramInfo.type = paramInfo.type || ParamType.SINGLE

        // setting required
        paramInfo.required == !!paramInfo.required

        // initializing choices
        paramInfo.choices = paramInfo.choices || []

        return paramInfo
    }

    protected validateItem(paramInfo: IParamInfo) {

        // Rule 1. Param must have a name
        // Name validation done by base class, by this point paramInfo will have a name
        paramInfo.name = paramInfo.name || ''

        // Rule 2. Param name must not already exists
        if (this.hasKey(paramInfo.name)) {
            throw new ConfigurationError('Parameter with same name already exists.', paramInfo)
        }

        // Rule 3. Only one parameter can be of a list type
        if (paramInfo.type == ParamType.LIST && this._containsListType) {
            throw new ConfigurationError('List type parameter already defined.', paramInfo)
        }

        // Rule 4. Required parameter cannot come after options parameter
        if (this._optionalParamDefined && paramInfo.required) {
            throw new ConfigurationError('Required Parameter cannot be defined after optional parameter(s).', paramInfo)
        }
    }

    protected finalizeItem(paramInfo: IParamInfo) {
        // setting list type flag, if not already set
        this._containsListType = this._containsListType || paramInfo.type == ParamType.LIST


        // setting list type flag, if not already set
        this._optionalParamDefined = this._optionalParamDefined || !paramInfo.required
    }

    /** Merges info with an existing param, or add as new param */
    public merge(paramInfo: IParamInfo) {

        // Getting existing param 
        var param = this.get(paramInfo.name || '')

        // merging and updating param if already exists 
        if (param) {
            param.choices = getPropertyValue(paramInfo, 'choices', param.choices)
            param.description = getPropertyValue(paramInfo, 'description', param.description)
            param.required = getPropertyValue(paramInfo, 'required', param.required)
            param.type = getPropertyValue(paramInfo, 'type', param.type)
            param.value = getPropertyValue(paramInfo, 'value', param.value)
            this.add(param, true)
        }

        // otherwise adding an param
        else {
            this.add(paramInfo)
        }

    }

    /** Merges infos with the existing params, or add as new params */
    public mergeList(paramList: IParamInfo[]) {

        // return if list is empty or undefined
        if (!paramList || !paramList.length) return

        // adding params iteratively 
        paramList.forEach(paramInfo => this.merge(paramInfo))

    }
}