import { Collection } from './base'
import { IOptionInfo } from '../info-objects'
import { ConfigurationError } from '../errors'
import { getPropertyValue } from '../../utils'
/*
    Options are the cli arguments that starts with '--' or '-'
    
    '-' is used for single characters for example '-a'
    '--' is used for multiple characters i.e. words example '--all'
    
    When multiple chars are used with '-' all chars are interpreted as options for example
    '-all' as '-a', '-l', and '-l'

    Any characters followed by '--' are interpreted as a single option for example
    '--abc-xyz---http:/a' as 'abc-xyz---http:/a' 

    Options are boolean types but if option is followed by a text, the text becomes the value
    of the options. Following are the examples of how options are interpreted-

    -r *.txt    => {r: '*.txt'}
    -r          => {r: true}
    --r         => {r: true}
    --r-abc     => {r-abc: true}
    -r:abc      => {r: ':abc'}
    -r=abc      => {r: 'abc'}
    -r abc      => {r: 'abc'}
    -r abc -r   => {r: ['abc', true]}

    more help on: https://www.npmjs.com/package/minimist
*/

/**
 * Represents Collection of Options
 * @example
 * easy-cli <command-name> [arguments] [[--option-name, -o] [value]]
 */
export class OptionCollection extends Collection<IOptionInfo>{

    // list of all names and aliases
    private _definedNames: string[] = []

    public add(optionInfo: IOptionInfo, update?: boolean) {
        if (!optionInfo) throw new ConfigurationError('Option cannot be null or undefined')

        // adding option
        // will throw error if name is empty, following is to bypass typescript error
        optionInfo.name = optionInfo.name || ''
        if (update) {
            super.update(optionInfo.name, optionInfo)
        }
        else {
            super.append(optionInfo.name, optionInfo)
        }

    }

    /** Adds a list of options */
    public addList(optionList?: IOptionInfo[], update?: boolean) {

        // return if list is empty or undefined
        if (!optionList || !optionList.length) return

        // adding options iteratively 
        optionList.forEach(optionInfo => this.add(optionInfo, update))
    }

    protected setupItem(optionInfo: IOptionInfo): IOptionInfo {

        // following is to bypass typescript validation
        optionInfo.name = optionInfo.name || ''

        // adding default description
        optionInfo.description = optionInfo.description || 'No Description'

        // converting alias into an array
        if (optionInfo.alias) {
            optionInfo.alias = !Array.isArray(optionInfo.alias) ? [optionInfo.alias] : optionInfo.alias

            // Rule 1. Aliased must not have duplicate values
            optionInfo.alias = optionInfo.alias.filter((value, index, self) => self.indexOf(value) === index)

            // Rule 2. Aliases must not match with the option name, if so remove that alias
            if (optionInfo.alias.indexOf(optionInfo.name) > -1) {
                optionInfo.alias = optionInfo.alias.filter(item => item != optionInfo.name)
            }
        }

        // initializing choices
        optionInfo.choices = Array.isArray(optionInfo.choices) ? optionInfo.choices : []

        return optionInfo
    }

    protected validateItem(optionInfo: IOptionInfo) {

        // Rule 1. Option must have a name
        // Name validation done by base class, by this point optionInfo will have a name

        // Adding alias
        if (Array.isArray(optionInfo.alias) && optionInfo.alias.length) {

            // Rule 2. Aliases must not match with existing options names or their aliases
            var matched = optionInfo.alias.some(name => {
                return this._definedNames.indexOf(name) > -1
            })
            if (matched) {
                throw new ConfigurationError('Unable to add option, option has an alias that is already used', optionInfo.alias)
            }
        }

    }

    protected finalizeItem(optionInfo: IOptionInfo) {

        // updating list of existing option names
        if (optionInfo.name) {
            this._definedNames.push(optionInfo.name)
        }

        // updating list of existing option names
        if (optionInfo.alias) {
            this._definedNames = this._definedNames.concat(optionInfo.alias)
        }
    }

    /** Merges info with an existing option, or add as new option */
    public merge(optionInfo: IOptionInfo) {
        //optionInfo.name
        var option = this.get(optionInfo.name || '')

        // merging and updating option if already exists 
        if (option) {
            option.alias = getPropertyValue(optionInfo, 'alias', option.alias)
            option.description = getPropertyValue(optionInfo, 'description', option.description)
            this.add(option, true)
        }

        // otherwise adding an option
        else {
            this.add(optionInfo)
        }

    }

    /** Merges infos with the existing options, or add as new options */
    public mergeList(optionList: IOptionInfo[]) {

        // return if list is empty or undefined
        if (!optionList || !optionList.length) return

        // adding options iteratively 
        optionList.forEach(optionInfo => this.merge(optionInfo))

    }
}
