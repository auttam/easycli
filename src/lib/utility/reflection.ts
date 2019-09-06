
export interface IMergeOptions { copyFunctions?: boolean, copyEmpty?: boolean, throwTypeError?: boolean, ignoreProps?: any[] }

/** Copies values from source to target for only properties that exists in target  */
export function mergeTypeSafe(target: any, source: any, options: IMergeOptions = {}) {
    if (!source || !target) return

    // default options
    options.copyEmpty = options.copyEmpty || false
    options.copyFunctions = options.copyFunctions || false
    options.throwTypeError = options.throwTypeError || false
    options.ignoreProps = Array.isArray(options.ignoreProps) ? options.ignoreProps : []

    Reflect.ownKeys(source).forEach(property => {

        // ignoring property from ignore list
        if (options.ignoreProps && options.ignoreProps.indexOf(property) > -1) return
        var propSource = Reflect.get(source, property)
        var propTarget = Reflect.get(target, property)

        // don't copy functions if copyFunctions is false
        if (typeof propSource == 'function' && !options.copyFunctions) return

        // don't copy if target doesn't have the property
        if (typeof propTarget == 'undefined') return

        // verify array
        if (Array.isArray(propTarget)) {
            // don't copy if source property is not an array
            if (!Array.isArray(propSource)) return
            // don't copy if source is empty and empty is not allowed
            if (!propSource.length && !options.copyEmpty) return
        }

        // don't copy empty value if not allowed
        if (!propSource && !options.copyEmpty) return

        // copy value
        if (typeof propSource == typeof propTarget) {
            Reflect.set(target, property, propSource)
        }
        else {
            if (options.throwTypeError) {
                throw new TypeError('Type mismatch while updating additional configuration, expected: "' + typeof propTarget + '" for "' + property.toString() + '"')
            }
        }
    });
}

/** Returns list of all methods for an object */
export function getOwnFunctions(target: any, cbFilter?: (prop: string, target: any) => boolean) {
    cbFilter = cbFilter && typeof 'function' ? cbFilter : prop => typeof target[prop] == 'function'
    var names = Object.getOwnPropertyNames(target)
    if (names.length) {
        return names.filter(cbFilter)
    }

    // else 
    return Object.getOwnPropertyNames(Object.getPrototypeOf(target)).filter(cbFilter)
}

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;
/** Gets names of method parameters */
export function getParameters(func: any) {
    let fnStr = (typeof func == 'string' ? func : func.toString()).replace(STRIP_COMMENTS, '');
    let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
        result = [];
    return result;
}