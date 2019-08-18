import { Param, ParamType, ParamCollection } from '../../lib/config/param-config'
import { ConfigurationError } from '../../lib/errors/config-error'
const expect = require('chai').expect

// Tests for Param Class
describe('Param Configuration Tests', () => {

    describe('constructor()', () => {
        it('throws exception on empty name', () => {
            expect(() => new Param({ name: '' })).to.throw(ConfigurationError)
        })

        it('hyphenates name', () => {
            var param = new Param({ name: 'myParam' })
            expect(param.name).to.equal('my-param')
        })

        it('camelCases the name for property name', () => {
            expect((new Param({ name: 'my-Param' })).propName).to.equal('myParam')
            expect((new Param({ name: '1My-#Param-two' })).propName).to.equal('1My#ParamTwo')
        })

        it('uses property name as-is if supplied', () => {
            expect((new Param({ name: 'my-Param', propName: 'Test100' })).propName).to.equal('Test100')
        })

        it('is not required by default', () => {
            var param = new Param({ name: 'myParam' })
            expect(param.required).to.equal(false)
        })

        it('is single value type by default', () => {
            var param = new Param({ name: 'myParam' })
            expect(param.type).to.equal(ParamType.SINGLE)
        })

        it('copies fields from config object', () => {
            var param = new Param({
                name: 'my-Param',
                acceptOnly: ['a'],
                help: 'help',
                value: 'val1'
            })
            expect(param).to.eql({
                name: 'my-param',
                acceptOnly: ['a'],
                help: 'help',
                value: 'val1',
                propName: 'myParam',
                required: false,
                type: 'single'
            })
        })

        it('removes duplicates from accepted values', () => {
            var param = new Param({ name: 'myParam', acceptOnly: ['v1', 'v2', 'v1'] })
            expect(param.acceptOnly).to.eql(['v1', 'v2'])
        })
    })
})

// Tests Param Collection
describe('Param Collection', () => {
    var collection: ParamCollection;

    beforeEach(function () {
        collection = new ParamCollection();
    })

    describe('add()', () => {
        it('adds new config', () => {
            var config = { name: 'param', help: 'param help' }
            collection.add(config)
            var got = collection.get('param')
            expect(got).to.include(config)
        })

        it('merges params with same names', () => {
            collection.add({
                name: 'my-param'
            })
            collection.add({
                name: 'my-param',
                propName: 'p1'
            })
            expect(collection.get('my-param')).to.include({ propName: 'p1' })
        })

        it('throws error for two params with same property names', () => {
            collection.add({
                name: 'my-param',
                propName: 'p1'
            })
            expect(() => {
                collection.add({
                    name: 'my-param2',
                    propName: 'p1'
                })
            }).to.throw(ConfigurationError)
        })

        it('throws error if required is defined after optional', () => {
            var config: any = { name: 'param1' }
            collection.add(config)
            expect(() => {
                collection.add({ name: 'param2', required: true })
            }).to.throw(ConfigurationError)
        })

        it('throws error if single type is defined after list type', () => {
            var config: any = { name: 'param1' }
            collection.add(config)
            collection.add({ name: 'param2', type: ParamType.LIST })

            expect(() => {
                collection.add({ name: 'param3', type: ParamType.SINGLE })
            }).to.throw(ConfigurationError)
        })

        it('throws error if there are more than one list type', () => {
            var config: any = { name: 'param1' }
            collection.add(config)
            collection.add({ name: 'param2', type: ParamType.LIST })

            expect(() => {
                collection.add({ name: 'param3', type: ParamType.LIST })
            }).to.throw(ConfigurationError)
        })

        it('allows to required after required param ', () => {
            var config: any = { name: 'param1', required: true }
            collection.add(config)
            expect(() => {
                collection.add({ name: 'param2', required: true })
                collection.add({ name: 'param3', required: true })
            }).to.not.throw(ConfigurationError)
        })

        it('allows to optional after required param ', () => {
            var config: any = { name: 'param1', required: true }
            collection.add(config)
            expect(() => {
                collection.add({ name: 'param2' })
            }).to.not.throw(ConfigurationError)
        })

    })

    describe('addList()', () => {
        it('throws error for an param in the list with empty names', function () {
            expect(() => collection.addList([{
                name: ""
            }])).to.throw(ConfigurationError)
        })
    })

    describe('addByPropNames()', () => {
        it('create collection from property names', () => {
            var props = ['param', 'paramName']
            collection.addByPropNames(props)
            expect(collection.get('param')).to.include({ name: 'param', propName: 'param' })
            expect(collection.get('param-name')).to.include({ name: 'param-name', propName: 'paramName' })
            collection.add({ name: "param", value: 'val1' })
            expect(collection.get('param')).to.include({ name: 'param', propName: 'param', value: 'val1' })
        })

        it('creates param of list type for ...param', () => {
            var props = ['param', '...paramName']
            collection.addByPropNames(props)
            expect(collection.get('param')).to.include({ name: 'param', propName: 'param' })
            expect(collection.get('param-name')).to.include({ name: 'param-name', propName: 'paramName', type: ParamType.LIST })
        })

        it('don\'t add param and options parameter', () => {
            var props = ['message', 'params', 'color', 'options']
            collection.addByPropNames(props)
            expect(collection.length).to.equal(2)
        })

        it('stores index of param and options parameter', () => {
            var props = ['message', 'params', 'color', 'options']
            collection.addByPropNames(props)
            expect(collection.indexParamsParam).to.equal(1)
            expect(collection.indexOptionsParam).to.equal(3)
        })
    })

    describe('addBySignature()', () => {
        it('adds params from method signature', () => {
            function test(message: any, testParam: any) { }
            collection.addBySignature(test)
            expect(collection.toArray().map(p => p.name)).to.eql(['message', 'test-param'])
            expect(collection.toArray().map(p => p.propName)).to.eql(['message', 'testParam'])
        })
    })

    describe('addByAny()', () => {
        it('add by any object that contains required properties', () => {
            collection.addByAny({
                name: 'my-param',
                something: 'abc',
                propName: 'abcd'
            })
            expect(collection.get('my-param')).to.include({ name: 'my-param', propName: 'abcd' })
        })
        it('merges by any object that contains required properties', () => {
            collection.addByAny({
                name: 'my-param',
                something: 'abc',
                propName: 'abcd'
            })
            collection.addByAny({
                name: 'my-param',
                propName: 'xyz'
            })
            expect(collection.get('my-param')).to.include({ name: 'my-param', propName: 'xyz' })
        })
    })
})