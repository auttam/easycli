import { exists } from "fs";

const expect = require('chai').expect
const Program = require('../../index').Program

/** tests execution of cli in no-command mode */

var argv = process.argv

describe('No-Command Mode', () => {

    describe("main()", () => {

        afterEach(() => {
            process.argv = argv
        })

        it('is called', async () => {
            var mainCalled = false
            class SampleProgram extends Program {
                main() {
                    mainCalled = true
                }
            }

            await Program.run(new SampleProgram())
            expect(mainCalled).to.equal(true)
        })

        it('is injected with $params', async () => {
            var injectedParams = null
            class SampleProgram extends Program {
                main(a: any, b: any, c: any, $params: any) {
                    injectedParams = $params
                }
            }

            await Program.run(new SampleProgram())
            expect(injectedParams).to.not.be.null
            expect(injectedParams).to.have.property("_")
        })

        it('is injected with $options', async () => {
            var injectedOptions = null
            class SampleProgram extends Program {
                main(a: any, b: any, c: any, $options: any) {
                    injectedOptions = $options
                }
            }

            await Program.run(new SampleProgram())
            expect(injectedOptions).to.not.be.null
            expect(injectedOptions).to.have.property("_")
        })


        it('receives parameters appropriately', async () => {
            var _o: any = 0, _a = 0, _b = 0, _c = 0, _p:any = 0;
            process.argv = ['node', './', '1', '2', '3', '4', '--x']
            class SampleProgram extends Program {
                main(a: any, $params: any, b: any, c: any, $options: any) {
                    _a = a
                    _b = b
                    _c = c
                    _p = $params
                    _o = $options
                }
            }
            await Program.run(new SampleProgram())

            expect(_a).to.equal(1)
            expect(_b).to.equal(2)
            expect(_c).to.equal(3)
            expect(_p._).to.eql([1, 2, 3, 4])
            expect(_o.isSet('x')).to.equal(true)

        })

        it('is called asynchronously', async () => {
            var executionResult1: any = 0
            var executionResult2: any = 0
            var executionResult3: any = 0
            function asyncFunc(val: number) {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve(val)
                    }, 300)
                })
            }
            class SampleProgram extends Program {
                async main() {
                    executionResult1 = await asyncFunc(100)
                    return 200
                }
                async onExit(error: any, execResult: any) {
                    executionResult2 = execResult
                    return await asyncFunc(300)
                }
            }
            executionResult3 = await SampleProgram.run(new SampleProgram())
            expect(executionResult1).to.equal(100)
            expect(executionResult2).to.equal(200)
            expect(executionResult3).to.equal(300)
        })

    })

    describe("onExit()", () => {
        afterEach(() => {
            process.argv = argv
        })

        it('is called before exiting', async () => {
            var mainCalled = null, exitCalled = null
            class SampleProgram extends Program {
                main() {
                    mainCalled = true
                }
                onExit() {
                    exitCalled = true
                }
            }

            await Program.run(new SampleProgram())
            expect(mainCalled).to.be.true
            expect(exitCalled).to.be.true
        })

    })

    it('', async () => {

    })

})