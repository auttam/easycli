//
// String Utils
// ----------------------
//

/**
 * Hyphenates a camel case string to a hyphenated string.
 * 
 * @example
 *      hyphenate('helloWorld') -> hello-world
 * 
 */
export function hyphenate(name: string): string {
    name = name || ''
    name = pascalCase(name)
    return name.replace(/([A-Z])/g, ($1, $p, o) => {
        return o == 0 ? $1.toLowerCase() : '-' + $1.toLowerCase()
    })
}

/**
 * Converts a string to a pascalCase string. 
 * 
 * @example 
 *      pascalCase('myClass') -> MyClass
 *      pascalCase('my-class') -> MyClass
 *      pascalCase('my_class') -> MyClass
 *      pascalCase('my.class') -> MyClass
 *      pascalCase('my class') -> MyClass
 *      pascalCase('my, class') -> MyClass
 *
 */
export function pascalCase(name: string): string {
    if (!name) return name
    let words: string[] = name.split(/[-_.,:\s]/)
    words = words.map((word: string) => {
        return word.charAt(0).toUpperCase() + word.substr(1)
    })
    return words.join('')
}

/**
 * Converts a string to camelCase string 
 * 
 * @example  
 *    MyClass -> myClass
 *    my-class -> myClass
 */
export function camelCase(name: string): string {
    name = pascalCase(name)
    return name.charAt(0).toLowerCase() + name.substr(1)
}

/**
 * Separates a hyphenated, camel or pascal cased string with a space
 * 
 * @example  
 *    HelloWorld -> Hello World
 *    Hello-World -> Hello World
 */
export function separateWords(text: string): string {
    text = hyphenate(text)
    return text.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.substr(1)).join(' ')
}



/** Filters a list */
export function filterList(list: string[], filter?: any | { include?: string[], exclude?: string[] }) {

    if (!filter || !list) return list


    // filter is a string (to include)
    if (typeof filter == 'string') {
        filter = { include: [filter] }
    }

    // filter is a string array (to include)
    if (Array.isArray(filter)) {
        filter = { include: filter }
    }

    // filter is an object
    // include array
    if (Array.isArray(filter.include)) {
        list = list.filter(list => {
            var matched: any = false
            filter.include.forEach((criteria: string) => {
                if (!matched && criteria) {
                    matched = list.match(new RegExp(criteria))
                }
            })
            return !!matched
        })
    }

    // exclude
    if (Array.isArray(filter.exclude)) {
        list = list.filter(content => {
            var matched: any = false
            filter.exclude.forEach((criteria: string) => {
                if (!matched && criteria) {
                    matched = content.match(new RegExp(criteria))
                }
            })
            return !matched
        })
    }

    return list
}


//
// Object Utils
// ----------------------
//

/** Gets a value for the property only if it is set in the object, otherwise returns the default value */
export function getPropertyValue(object: any, propertyName: any, defaultValue?: any) {
    return object.hasOwnProperty(propertyName) ? object[propertyName] : defaultValue
}
