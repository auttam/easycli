import { IOptionConfig, Option, OptionCollection } from '../../lib/config/option-config'
import { ConfigurationError } from '../../lib/errors/config-error'
const expect = require('chai').expect

// Tests for Option Class
describe('Option Class', () => {

    describe('constructor()', () => {
        it('throws exception on empty name', () => {
            expect(() => new Option({ name: '' })).to.throw(ConfigurationError)
        })

        it('uses name as-is', () => {
            var option = new Option({ name: 'myOption' })
            expect(option.name).to.equal('myOption')
        })

        it('uses name as property name in camelCased form', () => {
            expect((new Option({ name: 'my-option' })).propName).to.equal('myOption')
            expect((new Option({ name: '1My-#option-two' })).propName).to.equal('1My#optionTwo')
        })

        it('uses property name as-is if supplied', () => {
            expect((new Option({ name: 'my-option', propName: 'Test100' })).propName).to.equal('Test100')
        })

        it('copies fields from config object', () => {
            var option = new Option({
                name: 'my-Option',
                acceptOnly: ['a'],
                help: 'help',
                aliases: ['m2'],
                value: 'val1'
            })
            expect(option).to.eql({
                name: 'my-Option',
                acceptOnly: ['a'],
                help: 'help',
                aliases: ['m2'],
                value: 'val1',
                propName: 'myOption'
            })
        })

        it('removes duplicates from aliases', () => {
            var option = new Option({ name: 'myOption', aliases: ['a', 'a', 'b'] })
            expect(option.aliases).to.eql(['a', 'b'])
        })

        it('removes alias from aliases that matches name', () => {
            var option = new Option({ name: 'myOption', aliases: ['a', 'a', 'myOption', 'b'] })
            expect(option.aliases).to.eql(['a', 'b'])
        })

        it('removes duplicates from accepted values', () => {
            var option = new Option({ name: 'myOption', aliases: ['a', 'a', 'b'], acceptOnly: ['v1', 'v2', 'v1'] })
            expect(option.aliases).to.eql(['a', 'b'])
            expect(option.acceptOnly).to.eql(['v1', 'v2'])
        })
    })

    describe('merge()', () => {
        it('does not change name', () => {
            var option = new Option({ name: 'myOption' })
            option.merge({ name: 'myOption2' })
            expect(option.name).to.equal('myOption')
        })

        it('does change property name', () => {
            var option = new Option({ name: 'my-option' })
            expect(option.name).to.equal('my-option')
            expect(option.propName).to.equal('myOption')

            // merge config
            option.merge({ name: 'myOption2', propName: 'test' })

            expect(option.name).to.equal('my-option')
            expect(option.propName).to.equal('test')
        })

        it('does not replace fields with empty value', () => {
            var option = new Option({
                name: 'my-option',
                acceptOnly: ['a'],
                help: 'help',
                aliases: ['m2'],
                value: 'val1'
            })
            option.merge({ name: 'myOption2', acceptOnly: [], value: '', aliases: [], help: '' })
            expect(option).to.eql({
                name: 'my-option',
                acceptOnly: ['a'],
                help: 'help',
                aliases: ['m2'],
                value: 'val1',
                propName: 'myOption'
            })
        })


    })
})

// Tests Option Collection
describe('Option Collection', () => {
    var collection: OptionCollection;

    beforeEach(function () {
        collection = new OptionCollection();
    })

    describe('add()', () => {
        it('adds new config', () => {
            var config = { name: 'n', help: 'option-n' }
            collection.add(config)
            var got = collection.get('n')
            expect(got).to.include(config)
        })

        it('updates existing config', () => {
            var config = { name: 'n', help: 'help2' }
            collection.add(config)
            var got = collection.get('n')
            expect(got).to.include(config)
        })

        it('removes alias when it matches the option name', function () {
            collection.add({
                name: "option-name",
                aliases: ["option-name"]
            })
            collection.add({
                name: "option-name2",
                aliases: ["option-name2", "o", "option-name2"]
            })
            expect(collection.get("option-name").aliases).to.be.an('array').that.is.empty;
            expect(collection.get("option-name").propName).to.equal('optionName');
            expect(collection.get("option-name2").aliases).to.be.an('array').that.not.includes("option-name2");
            expect(collection.get("option-name2").aliases).to.be.an('array').that.includes("o");
        })

        it('throws error for an option that has alias that is already used', function () {
            collection.add({
                name: "option1",
                aliases: ["a"]
            })
            expect(() => collection.add({
                name: "option",
                aliases: ["a"]
            })).to.throw(ConfigurationError)
        })

        it('merges options with same names', () => {
            collection.add({
                name: 'my-option'
            })
            collection.add({
                name: 'my-option',
                propName: 'op1'
            })
            expect(collection.get('my-option')).to.include({ propName: 'op1' })
        })

        it('throws error for two options with same property names', () => {
            collection.add({
                name: 'my-option',
                propName: 'op1'
            })
            expect(() => {
                collection.add({
                    name: 'my-option2',
                    propName: 'op1'
                })
            }).to.throw(ConfigurationError)
        })

    })

    describe('addList()', () => {
        it('throws error for an option in the list with empty names', function () {
            expect(() => collection.addList([{
                name: ""
            }])).to.throw(ConfigurationError)
        })

        it('throws error for an option that has alias that is already used', function () {
            collection.add({
                name: "option1",
                aliases: ["a"]
            })
            expect(() => collection.addList([{
                name: "option",
                aliases: ["a"]
            }])).to.throw(ConfigurationError)
        })

        it('merges options with same names', () => {
            collection.add({
                name: 'my-option'
            })
            collection.add({
                name: 'my-option',
                propName: 'op1'
            })
            collection.addList([{
                name: 'my-option',
                help: 'help'
            }, {
                name: 'option2'
            }])
            expect(collection.get('my-option')).to.include({ propName: 'op1', help: 'help' })
        })
    })

})