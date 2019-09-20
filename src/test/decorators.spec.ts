const expect = require('chai').expect
import { Command, Cli } from '../lib/decorators'
import { ConfigurationError } from '../lib/errors/config-error';
import { updateStore } from '../lib/settings';

describe("Cli decorator", () => {
    it("starts program automatically by default", () => {
        var testValue = 0
        @Cli()
        class SimpleProgram { static run() { testValue = 1 } }
        expect(testValue).to.equal(1)
    })

    it("doesn't start program automatically if autorun is false", () => {
        var testValue = 0
        @Cli({ autorun: false })
        class SimpleProgram { start() { testValue = 1 } }
        expect(testValue).to.equal(0)

        new SimpleProgram().start()
        expect(testValue).to.equal(1)
    })

    it("replaces auto generated program config", () => {
        @Cli({ autorun: false })
        class SimpleProgram1 { }
        var prog: any = new SimpleProgram1()
        expect(prog.config.toConfig()).to.eql({ name: 'Simple Program1', binaryName: 'simple-program1', version: '1.0.0', help: '' })

        @Cli({ name: 'abc', autorun: false, version: '2', binaryName: 'b1', help: 'h1' })
        class SimpleProgram2 { }
        var prog: any = new SimpleProgram2()
        expect(prog.config.toConfig()).to.eql({ name: 'abc', version: '2', binaryName: 'b1', help: 'h1' })
    })

    it("adds params to program param collection", () => {
        @Cli({ autorun: false, params: [{ name: 'my-param1' }] })
        class SimpleProgram1 { }
        var prog: any = new SimpleProgram1()
        expect(prog.config.params.toArray('my-param1')[0]).to.include({ name: 'my-param1', propName: 'myParam1' })
    })

    it("adds option to program options collection", () => {
        @Cli({ autorun: false, options: [{ name: 'my-option1' }] })
        class SimpleProgram1 { }
        var prog: any = new SimpleProgram1()
        expect(prog.config.options.toArray('my-option1')[0]).to.include({ name: 'my-option1', propName: 'my-option1' })
    })
})

describe("Command decorator", () => {

    beforeEach(() => {
        updateStore({
            enableCommands: true
        })
    })

    afterEach(() => {
        updateStore({
            enableCommands: false
        })
    })

    it("adds method as command", () => {
        class SimpleProgram1 {
            @Command()
            test() { }
        }
        var prog: any = new SimpleProgram1()
        expect(prog.config.commands.length).to.equal(1)
    })

    it("replaces config for auto generated params", () => {
        class SimpleProgram1 {
            @Command({
                params: [{
                    name: 'message',
                    value: '2'
                }]
            })
            test(message: any, testParam: any) { }
        }
        var prog: any = new SimpleProgram1()
        var command = prog.config.commands.get('test')
        expect(command.params.get('message').value).to.equal('2')
    })

    it("throws exception for property name change for parameter auto-generated ", () => {
        expect(() => {
            class SimpleProgram1 {
                @Command({
                    params: [{
                        name: 'test-param',
                        propName: 'abc'
                    }]
                })
                testCommand(message: any, testParam: any) { }
            }
        }).to.throw(ConfigurationError)
        expect(() => {
            class SimpleProgram1 {
                @Command({
                    params: [{
                        name: 'testParam',
                        propName: 'abc'
                    }]
                })
                testCommand(message: any, testParam: any) { }
            }
        }).to.throw(ConfigurationError)
    })
})