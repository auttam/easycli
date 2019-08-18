const expect = require('chai').expect
import { Collection } from '../../lib/config/Collection'
import { ConfigurationError } from "../../lib/errors/config-error"


class CollectionTest extends Collection<{ name: string, value: string }> {
    append(key: any, value: any) {
        super.append(key, value)
    }
    hasKey(key: any) {
        return super.hasKey(key)
    }
    get(key: any) {
        return super.get(key)
    }
    find(target: any, propertyName?: any) {
        return super.find(target, propertyName)
    }
    protected validate(item: { name: string; value: string; }) {
        return true
    }
    protected itemAdded(item: { name: string; value: string; }): void { }
}

describe('Collection Class Tests', function () {

    var collection: CollectionTest;
    var testItem = { name: 'color', value: 'pink' }

    beforeEach(function () {
        collection = new CollectionTest();
    })

    describe('add()', function () {

        it('allows only string as a key', function () {
            expect(() => collection.append("key", testItem)).to.not.throw()
            expect(() => collection.append(1, testItem)).to.throw(ConfigurationError)
        })

        it('allows symbol key', function () {
            expect(() => collection.append(Symbol(), 'value')).to.not.throw(ConfigurationError)
        })

        it('throws error on adding duplicate key', function () {
            // adding first time
            collection.append('key', 'value')
            // adding second time and expecting exception
            expect(() => collection.append('key', 'value')).to.throw(ConfigurationError)
        })

        it('throws error on adding empty key', function () {
            expect(() => collection.append('', 'value')).to.throw(ConfigurationError)
        })

        it('calls validate() before adding', function () {
            var testObj: any = collection;
            testObj.validate = function (item: any) {
                throw "Test"
            }
            expect(() => testObj.append('key', 'value')).to.throw("Test")
        })

        it('adds item if validate() returns true', function () {
            var testObj: any = collection;
            testObj.validate = function (item: any) {
                return true
            }
            testObj.append('key', 'value')
            expect(testObj.get('key')).to.be.equal("value")
        })

        it('does not add item if validate() returns false', function () {
            var testObj: any = collection;
            testObj.validate = function (item: any) {
                return false
            }
            testObj.append('key', 'value')
            expect(testObj.get('key')).to.be.an("undefined")
        })

        it('adds item if validate() returns truthy value', function () {
            var testObj: any = collection;
            testObj.validate = function (item: any) {
                return 'false'
            }
            testObj.append('key', 'value')
            expect(collection.get('key')).to.be.equal("value")
        })
    })

    describe('hasKey()', function () {
        it('returns true if key is present', function () {
            var symbol1 = Symbol()
            collection.append(symbol1, 'value1')
            collection.append('key', 'value')
            expect(collection.hasKey('key')).to.be.equal(true)
            expect(collection.hasKey(symbol1)).to.be.equal(true)
            expect(collection.hasKey("undefined_key")).to.be.equal(false)
        })
    })

    describe('get()', function () {
        it('gets correct value for the key', function () {
            collection.append('key1', 'value1')
            collection.append('key2', 'value2')
            expect(collection.get('key1')).to.be.equal('value1');
            expect(collection.get('key2')).to.be.equal('value2');
        })

        it('gets correct value for the symbol key', function () {
            var symbol1 = Symbol()
            var symbol2 = Symbol()
            collection.append(symbol1, 'value1')
            collection.append('key2', 'value2')
            collection.append(symbol2, 'value3')
            expect(collection.get(symbol1)).to.be.equal('value1');
            expect(collection.get('key2')).to.be.equal('value2');
            expect(collection.get(symbol2)).to.be.equal('value3');
        })
    })

    describe('findByProperty()', function () {
        it('finds item by looking into each value and matching its property', function () {
            collection.append('0', 1);
            collection.append('1', {
                size: 1,
                name: 'alpha'
            })
            collection.append('2', {
                size: 2,
                name: 'beta'
            })
            collection.append('3', {
                size: 3,
                name: 'gamma'
            })
            expect(collection.find(3, 'size'))
                .to.be.an('object')
                .to.include({
                    size: 3,
                    name: 'gamma'
                })
        })
    })

});