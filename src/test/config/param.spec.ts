import { Param, ParamType, ParamCollection, IParamConfig } from '../../lib/config/param-config'
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
                type: 'single',
                $idx: -1
            })
        })

        it('removes duplicates from accepted values', () => {
            var param = new Param({ name: 'myParam', acceptOnly: ['v1', 'v2', 'v1'] })
            expect(param.acceptOnly).to.eql(['v1', 'v2'])
        })
    })

    describe('createFromAny()', () => {
        it('adds config by any object that contains required properties', () => {
            var param = Param.createFromAny({
                name: 'my-param',
                something: 'abc',
                propName: 'abcd'
            })
            expect(param).to.include({ name: 'my-param', propName: 'abcd' })
        })
    })
})

// Tests Param Collection
describe('Param Collection', () => {
    var collection: ParamCollection;

    beforeEach(function () {
        collection = new ParamCollection();
    })

    describe('initByProperties()', () => {

        it('create collection from list of property names', () => {
            var props = ['param', 'paramName']
            collection.initByProperties(props)
            expect(collection.get('param')).to.include({ name: 'param', propName: 'param' })
            expect(collection.get('param-name')).to.include({ name: 'param-name', propName: 'paramName' })
        })

        it('throws configuration error if collection is not empty', () => {
            var props = ['param', 'paramName']
            collection.initByProperties(props)
            expect(() => collection.initByProperties(props)).to.throw(ConfigurationError)
        })

        it('creates param of list type for ...param', () => {
            var props = ['param', '...paramName']
            collection.initByProperties(props)
            expect(collection.get('param')).to.include({ name: 'param', propName: 'param' })
            expect(collection.get('param-name')).to.include({ name: 'param-name', propName: 'paramName', type: ParamType.LIST })
        })

        it('doesn\'t add $params and $options parameter', () => {
            var props = ['message', '$params', 'color', '$options']
            collection.initByProperties(props)
            expect(collection.length).to.equal(2)
        })

        it('stores index of param and options parameter always', () => {
            var props = ['message', '$params', 'color', '$options']
            collection.initByProperties(props)
            expect(collection.indexParamsParam).to.equal(1)
            expect(collection.indexOptionsParam).to.equal(3)
        })

        it('stores index of defined parameters if saveIndex is set', () => {
            var props = ['message', '$params', 'color', '$options']
            collection.initByProperties(props, true)
            expect(collection.indexParamsParam).to.equal(1)
            expect(collection.indexOptionsParam).to.equal(3)
            expect(collection.get('message').$idx).to.equal(0)
            expect(collection.get('color').$idx).to.equal(2)
        })
    })

    describe('initByMethod()', () => {
        it('adds params from method signature', () => {
            function test(message: any, testParam: any) { }
            collection.initByMethod(test)
            expect(collection.toArray().map(p => p.name)).to.eql(['message', 'test-param'])
            expect(collection.toArray().map(p => p.propName)).to.eql(['message', 'testParam'])
        })
    })

    describe('merge()', () => {
        it('adds new param if collection is empty', () => {
            expect(collection.length).to.equal(0)
            var config = { name: 'param', help: 'param help' }
            collection.merge(config)
            expect(collection.length).to.equal(1)
            var got = collection.get('param')
            expect(got).to.include(config)
        })

        it('merges params with same names', () => {
            collection.merge({
                name: 'my-param'
            })
            collection.merge({
                name: 'my-param',
                propName: 'p1'
            })
            expect(collection.get('my-param')).to.include({ propName: 'p1' })
        })

        it('throws error for two params with same property names', () => {
            collection.merge({
                name: 'my-param',
                propName: 'p1'
            })
            expect(() => {
                collection.merge({
                    name: 'my-param2',
                    propName: 'p1'
                })
            }).to.throw(ConfigurationError)
        })

        it('throws error if required is defined after optional', () => {
            var config: any = { name: 'param1' }
            collection.merge(config)
            expect(() => {
                collection.merge({ name: 'param2', required: true })
            }).to.throw(ConfigurationError)
        })

        it('throws error if single type is defined after list type', () => {
            var config: any = { name: 'param1' }
            collection.merge(config)
            collection.merge({ name: 'param2', type: ParamType.LIST })

            expect(() => {
                collection.merge({ name: 'param3', type: ParamType.SINGLE })
            }).to.throw(ConfigurationError)
        })

        it('throws error if there are more than one list type', () => {
            var config: any = { name: 'param1' }
            collection.merge(config)
            collection.merge({ name: 'param2', type: ParamType.LIST })

            expect(() => {
                collection.merge({ name: 'param3', type: ParamType.LIST })
            }).to.throw(ConfigurationError)
        })

        it('allows to required after required param ', () => {
            var config: any = { name: 'param1', required: true }
            collection.merge(config)
            expect(() => {
                collection.merge({ name: 'param2', required: true })
                collection.merge({ name: 'param3', required: true })
            }).to.not.throw(ConfigurationError)
        })

        it('allows to optional after required param ', () => {
            var config: any = { name: 'param1', required: true }
            collection.merge(config)
            expect(() => {
                collection.merge({ name: 'param2' })
            }).to.not.throw(ConfigurationError)
        })

    })

    describe('mergeByConfigs()', () => {
        it('adds param if collection is empty', () => {
            expect(collection.length).to.equal(0)
            var config = { name: 'param', help: 'param help' }
            collection.mergeByConfigs([config])
            expect(collection.length).to.equal(1)
            var got = collection.get('param')
            expect(got).to.include(config)
        })
        it('merges available properties for the params in collection ', () => {
            collection.merge({ name: 'param1', help: 'h1', propName: 'prop1' })
            collection.merge({ name: 'param2', help: 'h2' })
            collection.merge({ name: 'param3', help: 'h3' })
            var lastParam = collection.get('param3')
            expect(collection.length).to.equal(3)
            expect(collection.get('param1')).to.include({ help: 'h1', propName: 'prop1' })
            expect(collection.get('param2')).to.include({ help: 'h2', propName: 'param2' })
            collection.mergeByConfigs([
                { name: 'param1', propName: 'p1' },
                { name: 'param5' },
                { name: 'param4' }])
            expect(collection.length).to.equal(3)
            expect(collection.get('param1')).to.include({ help: 'h1', propName: 'p1' })
            expect(collection.get('param5')).to.include({ help: 'h2', propName: 'param2' })
            lastParam.name = 'param4'
            expect(collection.toArray()[2]).to.eql(lastParam)
        })
        it('adds remaining params if existing collection is smaller', () => {
            collection.merge({ name: 'param1', help: 'h1', propName: 'prop1' })
            expect(collection.length).to.equal(1)
            collection.mergeByConfigs([
                { name: 'param1', propName: 'p1' },
                { name: 'param5' }])
            expect(collection.length).to.equal(2)
            expect(collection.get('param5')).to.include({ propName: 'param5' })
        })
        it('un-touch remaining prams from collection if list is smaller', () => {
            collection.merge({ name: 'param1', help: 'h1', propName: 'prop1' })
            collection.merge({ name: 'param2', help: 'h2' })
            expect(collection.length).to.equal(2)
            collection.mergeByConfigs([
                { name: 'param1', propName: 'p1' }])
            expect(collection.length).to.equal(2)
            expect(collection.get('param1')).to.include({ propName: 'p1' })
            expect(collection.get('param2')).to.include({ propName: 'param2' })

        })
        it('doesn\'t change $ids', () => {
            // @ts-ignore
            collection.merge({ name: 'param1', help: 'h1', propName: 'prop1', $idx: 5 })
            expect(collection.get('param1').$idx).to.equal(-1)
        })

        it('throws exception if $idx present and prop names are different', () => {
            function test(message: any, testParam: any) { }
            collection.initByMethod(test)
            collection.mergeByConfigs([{ name: 'param1' }])
            expect(collection.get('param1').propName).to.equal('message')
            expect(() => collection.mergeByConfigs([{ name: 'param1' }, { name: 'test-param', propName: 'prop1' }]))
                .to.throw(ConfigurationError)
        })
    })

})
