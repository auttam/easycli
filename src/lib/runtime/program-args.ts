import { SettingStore } from '../settings'
import { OptionCollection, IOptionConfig } from '../config/option-config'
import { RuntimeError } from '../errors/runtime-error'
import { ParamCollection, ParamType, IParamConfig } from '../config/param-config'
const minimist = require('minimist')


/** Class that contains all the supplied cli arguments categorized into command name, 
 *  params and options for the program */
export class ProgramArgs {
    /** first supplied argument if commands are enabled */
    private commandName: string = ''

    /** list of non-option arguments */
    private params: string[] = []

    /** object containing supplied options */
    private options: any = null

    /** All arguments supplied to the program */
    private suppliedArgs: string[] = []

    /** Object containing arguments parsed by minimist */
    private parsedArgs: any = {}

    /** whether any argument supplied to the program */
    isEmpty() {
        return !this.suppliedArgs || !this.suppliedArgs.length
    }

    /** Reads and parses supplied arguments from command line*/
    read(argv?: string[]) {

        // parsing raw arguments
        if (argv && Array.isArray(argv)) {
            this.suppliedArgs = argv.slice(SettingStore.processArgvStartIndex)
        } else {
            this.suppliedArgs = process.argv.slice(SettingStore.processArgvStartIndex)
        }

        // parsing raw arguments into minimist's parsed object
        if (SettingStore.minimistOptions) {
            this.parsedArgs = minimist(this.suppliedArgs, SettingStore.minimistOptions)
        } else {
            this.parsedArgs = minimist(this.suppliedArgs)
        }

        // setting first cli argument as command name
        if (SettingStore.enableCommands) {
            this.commandName = this.parsedArgs._ && this.parsedArgs._.length ? this.parsedArgs._[0] : ''
            this.parsedArgs._.shift()
        }
        // setting all supplied non-option arguments as program params
        this.params = this.parsedArgs._ || []

        // setting all supplied options as program options 
        delete this.parsedArgs._
        this.options = this.parsedArgs
    }

    /** gets first supplied argument if commands are enabled */
    getCommandName() {
        return this.commandName
    }

    /** gets list of non-option arguments supplied to the program */
    getParams() {
        return this.params
    }

    /** gets object containing supplied options */
    getOptions() {
        return this.options
    }

    /** Checks whether any option supplied to the program */
    optionsProvided() {
        return !!Object.keys(this.options).length
    }

    /** Checks whether program arguments contain specific option(s) */
    containsOption(name: string | string[]) {
        if (!name) return false
        if (!Array.isArray(name)) {
            name = [name]
        }

        // return if programArgs.options has any options from optionName List 
        for (var item of name) {
            if (typeof item == 'string' && this.options.hasOwnProperty(item)) return true
        }

        // options not present
        return false
    }

    /** Gets all supplied arguments in raw form */
    toArray() {
        return this.suppliedArgs
    }

    /** Creates a map for all defined options that are supplied to the program */
    async createOptionsMap(definedOptions?: OptionCollection) {

        var mappedOptions: any = {}

        // assign all options to default '_' property
        mappedOptions._ = Object.assign({}, this.options)

        // no need to proceed if definitions are missing
        if (!definedOptions || !definedOptions.length) return mappedOptions

        // iterating over all defined options in the collection
        for (var optionInfo of definedOptions.getItems()) {

            var value = null

            // matching defined option name with the supplied options
            if (optionInfo.name && this.options.hasOwnProperty(optionInfo.name)) {
                value = this.options[optionInfo.name]
            }

            // matching option's other names with the supplied options
            if (!value && optionInfo.aliases && optionInfo.aliases.length) {
                for (var alias of optionInfo.aliases) {
                    if (this.options.hasOwnProperty(alias)) {
                        value = this.options[alias]
                    }
                }
            }

            // validating supplied value of the option with the pre-defined set of values
            value = this.getAcceptedValue(value, optionInfo)

            // adding option to the map object
            if (value) {
                mappedOptions[optionInfo.propName] = value
            }
        }
        return mappedOptions
    }

    /** Creates a map for all defined params that are supplied to the program */
    async  createParamsMap(definedParams?: ParamCollection) {
        // object containing parameters mapped to supplied argument
        var mappedParams: any = {}

        // assign all options to default '_' property
        mappedParams._ = Array.from(this.params)

        // no need to proceed if definition is not available
        if (!definedParams || !definedParams.length) {
            return mappedParams
        }

        // first param to process
        var currentParamListIdx = 0

        for (var paramInfo of definedParams.getItems()) {

            // param name cannot be blank
            // following check is for bypass typescript type check
            if (!paramInfo.name) return

            // When no parameter is supplied to the program ->
            if (!this.params.length) {
                // Validation 1: Parameter configuration must have default value when no param is passed from cli
                if (paramInfo.required && typeof paramInfo.value == 'undefined') {
                    throw new RuntimeError('Required parameter missing', paramInfo.name)
                }
                continue
            }

            // when parameters are supplied ->

            // Set default value if present
            mappedParams[paramInfo.propName] = paramInfo.value || ''

            // get single value
            if (paramInfo.type == ParamType.SINGLE) {
                mappedParams[paramInfo.propName] = this.params[currentParamListIdx]
                currentParamListIdx++
            }

            // get list of values
            if (paramInfo.type == ParamType.LIST) {
                mappedParams[paramInfo.propName] = this.params.slice(currentParamListIdx)
                currentParamListIdx = this.params.length
            }

            // Validation 1: Parameter must have value when param is required
            if (paramInfo.required && !mappedParams[paramInfo.propName]) {
                throw new RuntimeError('Required parameter missing', paramInfo.name)
            }

            // getting allowed value
            mappedParams[paramInfo.propName] = this.getAcceptedValue(mappedParams[paramInfo.propName], paramInfo)
        }
        return mappedParams
    }

    getAcceptedValue(value: string | string[], infoObject?: IParamConfig | IOptionConfig): void | string | string[] {
        if (!value || !infoObject) return value

        // Get only allowed values when the info object contains a list of allowed value -->
        if (infoObject.acceptOnly && Array.isArray(infoObject.acceptOnly) && infoObject.acceptOnly.length) {

            // prepare a list to allowed values for case-insensitive search
            var acceptOnly = infoObject.acceptOnly.map((value: string) => value.toLowerCase())

            var matchedValue

            // get list of matched values from the allowed list when the value is an array
            if (Array.isArray(value) && value.length) {
                matchedValue = []
                for (var eachValue of value) {
                    var idx = acceptOnly.indexOf(eachValue.toLowerCase())
                    if (idx > -1) {
                        matchedValue.push(infoObject.acceptOnly[idx])
                    }
                }
            }

            // get single matched value from the allowed list when value is a string 
            if (!Array.isArray(value)) {
                var idx = acceptOnly.indexOf(value.toLowerCase())
                if (idx > -1) {
                    matchedValue = infoObject.acceptOnly[idx]
                }
            }

            // if no value is matched, set a default value as matched 
            if (!matchedValue && typeof infoObject.value != 'undefined') {
                matchedValue = infoObject.value
            }

            // throw run time exception if there is still no matched value at this point
            if (!matchedValue) {
                throw new RuntimeError(`Value not allowed for ${infoObject.name} ${(infoObject.hasOwnProperty('type') ? ' parameter' : ' option')} allowed values are ' ${infoObject.acceptOnly.join(', ')}`)
            }

            return matchedValue
        }

        // otherwise return value as is ->
        return value
    }
}