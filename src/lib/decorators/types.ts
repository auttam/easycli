import { ParamType } from '../config/param-config'

/** Shape of the Option definition */
export interface IOptionDefinition {
    /** name of the option */
    name?: string
    /** name of the property of options object */
    propName?: string
    /** help text for the option */
    help?: string
    /** list of other names for the option */
    aliases?: string[]
    /** predefined list to validate the value of the option  */
    acceptOnly?: string[]
    /**  default value for the option, must be one of accepted values */
    value?: string
}

/** Shape of the Parameter definition */
export interface IParamDefinition {
    /** name of the parameter */
    name?: string
    /** name of the property of param object or name of method parameter */
    propName?: string
    /** help text for the option */
    help?: string
    /** type of parameter in terms of whether to parse single or multiple arguments as param values */
    type?: ParamType
    /** when required, user must supply the parameter value*/
    required?: boolean
    /** predefined list to validate the value of the parameter  */
    acceptOnly?: string[]
    /**  default value for the parameter, must be one of accepted values */
    value?: string
}

/** Shape of the Command definition */
export interface ICommandDefinition {
    /** name of the command */
    name?: string
    /** help text for the option */
    help?: string
    // command parameters
    params?: IParamDefinition[]
    // command options
    options?: IOptionDefinition[]
}

/** Shape of the Program definition */
export interface IProgramDefinition {
    /** name of the program / cli */
    name?: string
    /** cli name as specified in "bin" field of package.json */
    binaryName?: string
    /** help on program */
    help?: string
    /** program version number */
    version?: string
    /** array of command parameters */
    params?: IParamDefinition[]
    /** array of options */
    options?: IOptionDefinition[]
    /** runs the program  */
    autorun?: boolean
}
