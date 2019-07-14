//
// This module defines the shapes of information objects. Information objects are used 
// to setup configuration for the program and its commands  
//

/** Shape of the Entity Information Object */
export interface IEntityInfo {
    /** name of the entity */
    name?: string

    /** description of the entity */
    description?: string
}

/** Shape of the Option Information Object */
export interface IOptionInfo extends IEntityInfo {
    // alias for the option
    alias?: string | string[]
}

/** Types of Command Params */
export enum ParamType {
    SINGLE = 'value', // accepts single value (default)
    LIST = 'list', // accepts list of values for command Param
    CHOICE = 'choice'
}

/** Shape of the Param Information Object */
export interface IParamInfo extends IEntityInfo {
    type?: ParamType // whether to accept single or a list of values, default should single
    choices?: string[]
    required?: boolean // default should be false
    value?: any // value to be used if not passed from cli
}

/** Shape of the Command Information Object */
export interface ICommandInfo extends IEntityInfo {

    // name of command method which is mapped to the command name
    method: string

    // command parameters
    params?: IParamInfo[]

    // command options
    options?: IOptionInfo[]
}

/** Shape of the Program Information Object */
export interface IProgramInfo extends IEntityInfo {
    /** name of the binary / package */
    binaryName?: string

    /** version of the cli */
    version?: string

    /** list of the program options */
    options?: IOptionInfo[]

    /** name of the default command, used when command parameter is not passed from cli */
    defaultCommand?: string,

    /** flag to auto run the program */
    autorun?: boolean // not regarded until set to false 
}