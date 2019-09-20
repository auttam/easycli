import { ConfigurationError } from '../errors/config-error'

/** Represents a Collection Class */
export abstract class Collection<T> {
    private _collection = new Map()

    /** Number items in the collection */
    public get length() {
        return this._collection.size
    }

    /** Gets item from collection using unique 'key' name */
    public get(key: string | Symbol): T {
        return this._collection.get(key)
    }

    /** Whether collection has the specified key */
    protected hasKey(key: string): boolean {
        return this._collection.has(key)
    }

    /** 
     * Iterates through every item in the collection and returns the first item
     * that matches the target. If propertyName is specified, it returns the first item 
     * and has a property that matches the propertyName and its value with the target
     */
    protected find(target: any, propertyName?: string) {
        // Search for the target
        for (var [key, item] of this._collection) {
            if (propertyName && typeof item == 'object' && item[propertyName] == target) {
                return item
            }
            if (item == target) {
                return item
            }
        }
    }

    /** Appends an item to the collection, using a 'key' */
    protected append(key: string | Symbol, item: T) {
        // Rule 1. Key must be present 
        if (!key) throw new ConfigurationError('Unable to add to collection, key cannot be null or empty')

        // Rule 2. Key must be a string or a symbol
        if (typeof key != 'string' && typeof key != 'symbol') throw new ConfigurationError('Unable to add to collection, key must be a string or a symbol')

        // Rule 3. When adding an item, collection must not already have a key with same name
        if (this._collection.has(key)) {
            throw new ConfigurationError('Unable to add to collection, Key already defined', key)
        }

        // validating item before adding
        if (this.validate(item) !== false) {

            // adding item to the collection
            this._collection.set(key, item)

            // final tasks to do with item after add
            this.itemAdded(item)
        }
    }

    /** Updates an item in the collection */
    protected update(key: string | Symbol, item: T) {

        // Rule 1. Key must be present 
        if (!key) throw new ConfigurationError('Unable to add to collection, key cannot be null or empty')

        // Rule 2. Key must be a string or a symbol
        if (typeof key != 'string' && typeof key != 'symbol') throw new ConfigurationError('Unable to add to collection, key must be a string or a symbol')

        // Rule 3. When updating an item, collection must already have a key with same name
        if (!this._collection.has(key)) {
            throw new ConfigurationError('Unable to update to collection, Key not found', key)
        }

        // validating item before adding
        if (this.validate(item) !== false) {

            // adding item to the collection
            this._collection.set(key, item)

            // final tasks to do with item after add
            this.itemAdded(item)
        }
    }

    /** Clears the collection */
    protected clear() {
        this._collection.clear()
    }

    /** Gets all items from the collection */
    getItems(): IterableIterator<T> {
        return this._collection.values()
    }

    /** Get all the keys of the collection */
    getKeys(): IterableIterator<string | symbol> {
        return this._collection.keys()
    }

    /** Converts values into array */
    toArray(): T[] {
        return Array.from(this.getItems())
    }

    /** A method to validate the item being added, must throw error or return false to cancel adding */
    protected abstract validate(item: T): any

    /** A method called to after item is added, can be used to perform final tasks with the item added  */
    protected abstract itemAdded(item: T): void

    /** A method to re-validate each item in collection */
    public abstract verify(): void
}