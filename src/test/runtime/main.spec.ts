const expect = require('chai').expect
import { Program } from '../../lib/program'
import * as Runtime from '../../lib/runtime/main'
import { RuntimeError } from '../../lib/errors/runtime-error';

describe("Runtime Tests", () => {

    var argv = process.argv

    describe("createContext()", () => {

        it("throws when target program is null", () => {
            expect(() => Runtime.createContext(null, null)).to.throw('Unable to create runtime context, target program is null')
        })

        it("throws when target doesn't have constructor", () => {
            expect(() => Runtime.createContext(Object.create(null), null)).to.throw('Unable to create runtime context, constructor is missing')
        })

        it("throws when target program is not inherited from Program", () => {
            class Test extends Program { }
            expect(() => Runtime.createContext({}, Program)).to.throw('Unable to create runtime context, target program is not an instance of Program Class')
            expect(() => Runtime.createContext(new Test(), Program)).to.not.throw()
        })

        it("throws when target is direct instance of Program", () => {
            expect(() => Runtime.createContext(new Program(), Program)).to.throw('Unable to create runtime context, target program is not derived from Program Class')
        })

        it("throws when context already created", () => {
            class Test extends Program { }
            // creating context first time
            expect(() => Runtime.createContext(new Test(), Program)).to.not.throw()
            // creating context again
            expect(() => Runtime.createContext(new Test(), Program)).to.throw('Unable to create runtime context, context already created')
        })

        it("creates context with created state", () => {
            class Test extends Program { }
            var context = Runtime.createContext(new Test(), Program)
            expect(context.state).to.equal('created')
        })

        it("adds context to the context container", () => {
            class Test extends Program { }
            var program = new Test()
            var created = Runtime.createContext(program, Program)
            var retrieved = Runtime.getContext(program)
            expect(created).to.eql(retrieved)
        })

    })

    describe("getContext()", () => {
        it("contexts are stored and retrieved correctly", () => {
            class Test1 extends Program { }
            var program1 = new Test1()
            var created1 = Runtime.createContext(program1, Program)
            var retrieved1 = Runtime.getContext(program1)
            expect(created1).to.eql(retrieved1)

            class Test2 extends Program { }
            var program2 = new Test2()
            var created2 = Runtime.createContext(program2, Program)
            var retrieved2 = Runtime.getContext(program2)
            expect(created2).to.eql(retrieved2)

            expect(created1).to.not.eql(created2)
            expect(retrieved1).to.not.eql(retrieved2)
        })
    })

    describe("runProgram()", () => {

        it("throws is context doesn't belongs to the program", async () => {
            class Test1 extends Program { }
            class Test2 extends Program { }
            var program1 = new Test1()
            var program2 = new Test2()
            var context1 = Runtime.createContext(program1, Program)

            try {
                // correct context, wrong program
                await Runtime.runProgram(program2, context1)
            } catch (ex) {
                expect(ex.message).to.equal("Cannot run program, context mismatch")
            }
        })

        it("throws when context is in running state", async () => {
            class Test extends Program { }
            var program = new Test()
            var context = Runtime.createContext(program, Program)

            // no error 
            await Runtime.runProgram(program, context)

            try {
                await Runtime.runProgram(program, context)
            } catch (ex) {
                expect(ex.message).to.equal("Cannot run program due to incorrect program state")
            }

        })


        it("throws is configuration is missing", async () => {
            class Test extends Program { }
            var program = new Test()
            //@ts-ignore
            program.config = null
            var context = Runtime.createContext(program, Program)

            try {
                // correct context, wrong program
                await Runtime.runProgram(program, context)
            } catch (ex) {
                expect(ex.message).to.equal("Cannot run program, configuration missing")
            }
        })

        describe("shows help when arguments not supplied", () => {

            beforeEach(() => {
                process.argv = []
            })

            after(() => {
                process.argv = argv
            })

            it("commands enabled && showHelpOnNoCommand=true", async () => {
                Program.settings({
                    enableCommands: true
                })
                class Test extends Program { }
                var program = new Test()
                var result = 0
                program.showHelp = function () {
                    result = 1
                }
                await Runtime.runProgram(program, Runtime.createContext(program, Program))
                expect(result).to.equal(1)
            })

            it("commands not enabled && program has required param", async () => {
                Program.settings({
                    enableCommands: false
                })
                class Test extends Program { }
                var program = new Test({
                    params: [{
                        name: "message",
                        required: true
                    }]
                })
                var result = 0
                program.showHelp = function () {
                    result = 2
                }
                await Runtime.runProgram(program, Runtime.createContext(program, Program))
                expect(result).to.equal(2)
            })

        })

        it("shows help when --help is set and global help option is enabled", async () => {
            class Test extends Program { }
            var program = new Test()
            var result = 0
            program.showHelp = () => {
                result = 1
            }
            process.argv = ['a', 'b', '--help']
            var context = Runtime.createContext(program, Program)

            await Runtime.runProgram(program, context)
            expect(result).to.equal(1)
        })

        it("shows version when --ver is set and global version option is enabled", async () => {
            class Test extends Program { }
            var program = new Test()
            var result = 0
            program.showVersion = () => {
                result = 2
            }
            process.argv = ['a', 'b', '--ver']
            var context = Runtime.createContext(program, Program)

            await Runtime.runProgram(program, context)
            expect(result).to.equal(2)
        })

        it("calls context.runProgram", async () => {
            class Test extends Program { }
            var program = new Test()
            var result = 0

            process.argv = ['a', 'b', 'c']
            var context = Runtime.createContext(program, Program)
            context.runProgram = async () => {
                result = 5
            }

            await Runtime.runProgram(program, context)
            expect(result).to.equal(5)
        })
        // it("", () => { })

    })

})