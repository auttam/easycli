import { ProgramArgs } from '../lib/program-args'
import { SettingStore } from '../lib/settings'
import { ParamCollection, ParamType } from '../lib/config/param-config';
import { OptionCollection } from '../lib/config/option-config';
import { ConfigurationError } from '../lib/errors/config-error';
import { RuntimeError } from '../lib/errors/runtime-error';

const expect = require('chai').expect

// Tests for Program Args class
describe('Program Args', () => {

    var args = ['node', './', 'arg1', 'arg2', '--option-arg1', '--option-arg2', 'arg3', 'arg4', '--no-option-arg5']
    var progArgs: ProgramArgs
    var processArgs: any = process.argv

    beforeEach(() => {
        progArgs = new ProgramArgs()
    })

    afterEach(() => {
        SettingStore.enableCommands = false
    })


    describe('supplied()', () => {
        it('reads from specified index', () => {
            progArgs.read(args)
            expect(progArgs.supplied().length).to.equal(7)
            expect(progArgs.supplied()[0]).to.equal('arg1')
        })
    })

    describe('read()', () => {

        it('reads process.argv if argv is not supplied', () => {
            process.argv = ['node', './', 'arg1', 'arg2', 'arg3']
            progArgs.read()
            process.argv = processArgs
            expect(progArgs.params).to.eql(['arg1', 'arg2', 'arg3'])
        })

        it('reads non-option arguments as params', () => {
            progArgs.read(args)
            expect(progArgs.params).to.eql(['arg1', 'arg2', 'arg4'])
        })

        it('reads option arguments as options', () => {
            progArgs.read(args)
            expect(progArgs.options).to.eql({ 'option-arg1': true, 'option-arg2': 'arg3', 'option-arg5': false })
        })

        it('reads first argument as command name if commands enabled', () => {
            SettingStore.enableCommands = true
            progArgs.read(args)
            expect(progArgs.commandName).to.equal('arg1')
            expect(progArgs.params).to.eql(['arg2', 'arg4'])
        })

    })

    describe('optionsProvided()', () => {
        it('returns true if options are supplied', () => {
            progArgs.read(args)
            expect(progArgs.optionsProvided()).to.equal(true)
        })

        it('returns false if options are not supplied', () => {
            progArgs.read(['a', 'b', 'c', 'd'])
            expect(progArgs.optionsProvided()).to.equal(false)
        })
    })

    describe('containsOption()', () => {
        it('returns true of option is supplied', () => {
            progArgs.read(args)
            expect(progArgs.containsOption(['option-arg1', 'option-arg2'])).to.equal(true)
        })
    })

    describe('getAcceptedValue()', () => {
        it('returns value as-is if configuration is not supplied', () => {
            progArgs.read(args)
            var value = progArgs.getAcceptedValue('test')
            expect(value).to.equal('test')
        })

        it('returns value as-is if configuration doesn\'t have acceptOnly', () => {
            progArgs.read(args)
            var value = progArgs.getAcceptedValue('test', { name: 'option-arg1' })
            expect(value).to.equal('test')
        })

        it('returns value for option from acceptOnly list', () => {
            progArgs.read(args)
            var value = progArgs.getAcceptedValue('test', { name: 'option-arg1', acceptOnly: ['Test'] })
            expect(value).to.equal('Test')
        })

        it('returns value for param from acceptOnly list', () => {
            progArgs.read(args)
            var value = progArgs.getAcceptedValue('test', { name: 'my-param', type: ParamType.LIST, acceptOnly: ['TEST'] })
            expect(value).to.equal('TEST')
        })

        it('throws exception when value not matched and default value is not set', () => {
            progArgs.read(args)
            expect(()=>{
                progArgs.getAcceptedValue('test', { name: 'option-arg1', acceptOnly:['a'] })
            }).to.throw(RuntimeError)
            var value = progArgs.getAcceptedValue('test', { name: 'option-arg1', acceptOnly:['a'], value:'test' })
            expect(value).to.equal('test')
        })
    })

    describe('createParamsMap()', () => {
        it('maps param collection with supplied params', async () => {
            progArgs.read(args)
            var collection = new ParamCollection()
            collection.addList([{ name: 'my-param1' }, { name: 'my-param2' }])
            var param = await progArgs.createParamsMap(collection)
            expect(param.myParam1).to.equal('arg2')
            expect(param.myParam2).to.equal('arg4')
        })
    })

    describe('createOptionsMap()', () => {
        it('maps option collection with supplied options', async () => {
            progArgs.read(args)
            var collection = new OptionCollection()
            collection.addList([{ name: 'option-arg1' }, { name: 'option-arg2', propName: 'optionA' }])
            var option = await progArgs.createOptionsMap(collection)
            expect(option.optionArg1).to.equal(true)
            expect(option.optionA).to.equal('arg3')
        })
    })
})