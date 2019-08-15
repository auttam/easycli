import { Command, ICommandConfig, CommandCollection } from '../../lib/config/command-config'
import { ConfigurationError } from '../../lib/errors/config-error'

const expect = require('chai').expect

// Tests for Command Class
describe('Command Class', () => {

    describe('constructor()', () => {

        it('throws exception on empty method name', () => {
            expect(() => new Command({ method: '' })).to.throw(ConfigurationError)
        })

        it('uses method name as propName', () => {
            var command = new Command({ method: 'myCommand' })
            expect(command.propName).to.equal('myCommand')
        })

        it('sets command name from method name in hyphenated form if name not provided', () => {
            var command = new Command({ method: 'my1Command' })
            expect(command.name).to.equal('my1')

            // should not remove command name
            var command2 = new Command({ method: 'myCommand1' })
            expect(command2.name).to.equal('my-command1')
        })

        it('uses name as-is if provided', () => {
            var command = new Command({ name: 'Test', method: "p1" })
            expect(command.name).to.equal('Test')
        })

        it('removes command suffix when setting name from property name', () => {
            var command = new Command({ method: "myNewCommand" })
            expect(command.name).to.equal('my-new')
        })

        it('converts config to all internal fields', () => {
            var config: ICommandConfig = {
                name: 'name1',
                method: "myCommand",
                help: "help1"
            }
            var command = new Command(config)
            expect(command).to.include({ name: 'name1', propName: 'myCommand', help: 'help1' })
        })

        it('assigns params', () => {
            var command = new Command({
                name: 'Test',
                method: 'p1',
                params: [
                    {
                        name: "param1"
                    }
                ]

            })
            expect(command.params.get('param1').propName).to.equal('param1')
            expect(command.params.length).to.equal(1)
        })

        it('assigns options', () => {
            var command = new Command({
                name: 'Test',
                method: 'p1',
                options: [
                    {
                        name: "option1"
                    }
                ]

            })
            expect(command.options.get('option1').propName).to.equal('option1')
            expect(command.options.length).to.equal(1)
        })

    })

    describe('merge()', () => {
        it('discards new method name', () => {
            var command = new Command({ method: 'myCommand' })
            command.merge({ method: 'somethingElse' })
            expect(command.propName).to.equal('myCommand')
        })

        it('allows name change', () => {
            var command = new Command({ method: 'myCommand' })
            expect(command.name).to.equal('my')
            command.merge({ name: 'test', method: '' })
            expect(command.name).to.equal('test')
        })
    })

    describe('toCommandConfig()', () => {
        it("converts into ICommandConfig", () => {
            var config: ICommandConfig = {
                name: 'n1',
                method: 'm1',
                help: 'h1'
            }
            expect(new Command(config).toCommandConfig()).to.eql(config)
        })
    })
})

describe('Collection Class', () => {
    var collection: CommandCollection
    beforeEach(() => {
        collection = new CommandCollection()
    })

    describe('add()', () => {

        it("uses property name as key", () => {
            collection.add({ name: 'n1', method: 'm1' })
            expect(collection.get('m1').name).to.equal('n1')
        })

        it("merges two commands with same property name", () => {
            collection.add({ name: 'n1', method: 'm1' })
            collection.add({ name: 'n2', method: 'm1' })
            expect(collection.get('m1').name).to.equal('n2')
        })

        it("doesn't allow two commands with same command name", () => {
            collection.add({ name: 'n1', method: 'm1' })
            expect(() => { collection.add({ name: 'n1', method: 'm2' }) }).to.throw(ConfigurationError)
        })

        it("merges params", () => {
            collection.add({ name: 'n1', method: 'M1', params: [{ name: 'my-param', help: 'h1' }] })
            // first merge
            collection.add({ name: 'n2', method: 'M1' })
            expect(collection.get('M1').name).to.equal('n2')
            expect(collection.get('M1').params.get('my-param').help).to.equal('h1')
            // second merge
            collection.add({ name: 'n2', method: 'M1', params: [{ name: 'my-param', help: 'h2' }] })
            expect(collection.get('M1').params.get('my-param').help).to.equal('h2')
        })

        it("merges options", () => {
            collection.add({ name: 'n1', method: 'M1', options: [{ name: 'my-option', help: 'h1' }] })
            // first merge
            collection.add({ name: 'n2', method: 'M1' })
            expect(collection.get('M1').name).to.equal('n2')
            expect(collection.get('M1').options.get('my-option').help).to.equal('h1')
            // second merge
            collection.add({ name: 'n2', method: 'M1', options: [{ name: 'my-option', help: 'h2' }] })
            expect(collection.get('M1').options.get('my-option').help).to.equal('h2')
        })
    })

    describe('getByName()', () => {

        it("gets command by command name", () => {
            collection.add({ name: 'n1', method: 'M1' })
            collection.add({ name: 'n2', method: 'M2' })
            var command = collection.getByName('n2')
            expect(command.propName).to.equal('M2')
        })

        it("return null on item not found", () => {
            var command = collection.getByName('m2')
            expect(command).to.be.an("undefined")
        })
    })
})