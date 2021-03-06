import { IProgramConfig, ProgramConfiguration } from '../../lib/config/program-config'
import { ConfigurationError } from '../../lib/errors/config-error'
import { SettingStore, updateStore } from '../../lib/settings';

const expect = require('chai').expect

// Tests for Program Configuration 
describe('Program Configuration Class', () => {

    describe('readFromObject()', () => {
        afterEach(() => {
            updateStore({
                enableCommands: false,
                defaultCommandMethod: 'defaultCommand',
            })
        })

        it('throws exception on object literal', () => {
            var config = new ProgramConfiguration()
            expect(() =>
                config.readFromObject({
                    prop: 1,
                    method: () => { },
                    defaultCommand: () => { },
                    testCommand: () => { }
                })).to.throw(ConfigurationError)
        })

        it('doesn\'t throws exception on class object', () => {
            var config = new ProgramConfiguration()
            class SampleProgram { }
            expect(() => config.readFromObject(new SampleProgram())).to.not.throw(ConfigurationError)
        })

        it('uses class name in a separated words form as program name', () => {
            var config = new ProgramConfiguration()
            class SampleProgram { }
            config.readFromObject(new SampleProgram())
            expect(config.name).to.equal('Sample Program')
        })

        it('uses class name in a hyphenated form as binary name', () => {
            var config = new ProgramConfiguration()
            class SampleProgram { }
            config.readFromObject(new SampleProgram())
            expect(config.binaryName).to.equal('sample-program')
        })

        it('reads methods with "Command" suffix as program commands when enabled', () => {
            var config = new ProgramConfiguration()
            updateStore({
                enableCommands: true
            })
            class SampleProgram {
                test1() { }
                test2Command() { }
                method() { }
                get a() { return 1 }
                set a(v) { }
            }
            config.readFromObject(new SampleProgram())
            expect(config.binaryName).to.equal('sample-program')
            expect(config.commands.length).to.equal(1)
            var command = Array.from(config.commands.getItems())[0]
            expect(command).to.not.an('undefined')
            expect(command.name).to.equal('test2')
            expect(command.propName).to.equal('test2Command')
        })

        it('generates command params collection from method signature', () => {
            var config = new ProgramConfiguration()
            updateStore({
                enableCommands: true
            })
            class SampleProgram {
                test1() { }
                test2Command(message: any, saveFile: any) { }
                method() { }
                get a() { return 1 }
                set a(v) { }
            }
            config.readFromObject(new SampleProgram())
            var command = config.commands.toArray()[0]
            var params = command.params.toArray()
            expect(params[0].name).to.equal('message')
            expect(params[0].propName).to.equal('message')
            expect(params[1].propName).to.equal('saveFile')
            expect(params[1].name).to.equal('save-file')
        })

        it('generates program params collection from main method signature', () => {
            var config = new ProgramConfiguration()
            class SampleProgram {
                main(message: any, saveFile: any) { }
                method() { }
                get a() { return 1 }
                set a(v) { }
            }
            config.readFromObject(new SampleProgram())
            var params = config.params.toArray()
            expect(params[0].name).to.equal('message')
            expect(params[0].propName).to.equal('message')
            expect(params[1].propName).to.equal('saveFile')
            expect(params[1].name).to.equal('save-file')
        })

        it('doesn\'t read program commands when not enabled', () => {
            var config = new ProgramConfiguration()
            class SampleProgram {
                test1() { }
                test2Command() { }
                method() { }
                get a() { return 1 }
                set a(v) { }
            }
            config.readFromObject(new SampleProgram())
            expect(config.binaryName).to.equal('sample-program')
            expect(config.commands.length).to.equal(0)
        })

        it('doesn\'t add default command to the command collection', () => {
            var config = new ProgramConfiguration()
            updateStore({
                enableCommands: true
            })

            class Sample1 { defaultCommand() { } }
            config.readFromObject(new Sample1())
            console.log(config.commands)
            expect(config.commands.length).to.equal(0)

            updateStore({
                enableCommands: true,
                defaultCommandMethod: 'test123',
            })
            class Sample2 { test123() { } }
            config = new ProgramConfiguration()
            config.readFromObject(new Sample2())
            expect(config.commands.length).to.equal(0)

        })
    })

    describe('injectConfiguration()', () => {
        it('injects config in the target class object', () => {
            class Sample { }
            var target: any = new Sample()
            ProgramConfiguration.injectConfiguration(target)
            expect(target.config).to.not.an('undefined')
            expect(target.config.name).to.equal('Sample')
        })

        it('throws config error when target object is object literal', () => {
            expect(() => ProgramConfiguration.injectConfiguration({})).to.throw(ConfigurationError)
        })
    })

    describe('merge()', () => {

        class SampleProgram {
            test1() { }
            test2Command(message: any, saveFile: any) { }
            method() { }
            get a() { return 1 }
            set a(v) { }
            main(param1: any, param2: any, $options: any, $params: any) { }
        }

        it('replaces auto generated program info', () => {
            var config = new ProgramConfiguration()

            config.readFromObject(new SampleProgram())
            // generated info
            expect(config.toConfig()).to.eql({
                name: 'Sample Program',
                binaryName: 'sample-program',
                version: '1.0.0',
                help: ''
            })
            // merged info
            config.merge({
                name: 'name2',
                binaryName: 'bname1',
                help: 'h',
                version: '2'
            })
            expect(config.toConfig()).to.eql({
                name: 'name2',
                binaryName: 'bname1',
                help: 'h',
                version: '2'
            })
        })

        it('replaces auto generated params except property name', () => {
            var config = new ProgramConfiguration()
            config.readFromObject(new SampleProgram())
            expect(config.params.toArray()[0]).to.include({ name: 'param1', propName: 'param1', help: '' })
            config.merge({
                params: [
                    { name: 'param1', help: 'h1' }
                ]
            })
            expect(config.params.toArray()[0]).to.include({ name: 'param1', propName: 'param1', help: 'h1' })

            expect(() => config.merge({
                params: [
                    { name: 'param1', propName: 'prop1' }
                ]
            })).to.throw(ConfigurationError)
        })
    })
})
