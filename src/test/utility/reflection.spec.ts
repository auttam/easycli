import { expect } from 'chai'
import { mergeTypeSafe, getParameters, getOwnFunctions } from '../../lib/utility/reflection'

describe('Reflection Utility Tests', function () {

    describe('mergeTypeSafe()', function () {
        it('copies only defined properties', function () {
            var target: any = { a: 1, b: 2 }
            var source: any = { c: 3 }
            mergeTypeSafe(target, source)
            expect(target).to.be.eql({ a: 1, b: 2 })

            target = { a: 1, b: 2 }
            source = { a: 5, c: 3 }
            mergeTypeSafe(target, source)

            expect(target).to.be.eql({ a: 5, b: 2 })
        })

        it('copies only if type is matched', function () {

            var target: any = { a: 1, b: 2 }
            var source: any = { a: 2, b: "3" }
            mergeTypeSafe(target, source)
            expect(target).to.be.eql({ a: 2, b: 2 })

            target = { a: "one", b: 2 }
            source = { a: "two", b: 2 }
            mergeTypeSafe(target, source)

            expect(target).to.be.eql({ a: 'two', b: 2 })
        })

        it('copies empty array only if allowed', function () {
            // array
            var target: any = { a: 1, b: [2] }
            var source: any = { a: 2, b: [] }
            mergeTypeSafe(target, source)
            expect(target).to.be.eql({ a: 2, b: [2] })

            target = { a: "one", b: [2] }
            source = { a: "two", b: [] }
            mergeTypeSafe(target, source, { copyEmpty: true })
            expect(target).to.be.eql({ a: 'two', b: [] })
        })

        it('copies null object only if allowed', function () {
            // other values
            var target = { a: "one", b: {} }
            var source = { a: "two", b: null }
            mergeTypeSafe(target, source)
            expect(target).to.be.eql({ a: 'two', b: {} })

            target = { a: "one", b: {} }
            source = { a: "two", b: null }
            mergeTypeSafe(target, source, { copyEmpty: true })
            expect(target).to.be.eql({ a: 'two', b: null })
        })

        it('copies empty values only if allowed', function () {
            var target = { a: "one", b: '3' }
            var source = { a: "two", b: '' }
            mergeTypeSafe(target, source)
            expect(target).to.be.eql({ a: 'two', b: '3' })

            target = { a: "one", b: '3' }
            source = { a: "two", b: '' }
            mergeTypeSafe(target, source, { copyEmpty: true })
            expect(target).to.be.eql({ a: 'two', b: '' })
        })

        it('copies functions only if allowed', function () {
            var fn1 = (a: any) => { }
            var fn2 = (b: any) => { }
            var target: any = { a: 1, b: 2, c: fn1 }
            var source: any = { a: 5, c: fn2 }
            mergeTypeSafe(target, source)
            expect(target).to.be.eql({ a: 5, b: 2, c: fn1 })

            target = { a: 1, b: 2, c: fn1 }
            source = { a: 5, c: fn2 }
            mergeTypeSafe(target, source, { copyFunctions: true })
            expect(target).to.be.eql({ a: 5, b: 2, c: fn2 })
        })

        it('throws exception on type mismatch when throwTypeError is set', function () {
            var target: any = { a: 1, b: 2 }
            var source: any = { b: "2" }
            expect(() => { mergeTypeSafe(target, source, { throwTypeError: true }) }).to.throw(TypeError)
        })

        it('ignores properties if mentioned in ignoreProps option', function () {
            var target = { a: "one", b: '3', c: 1 }
            var source = { a: "two", b: '', c: 2 }
            mergeTypeSafe(target, source)
            expect(target).to.be.eql({ a: 'two', b: '3', c: 2 })

            target = { a: "one", b: '3', c: 1 }
            source = { a: "two", b: '5', c: 2 }
            mergeTypeSafe(target, source, { ignoreProps: ['a', 'c'] })
            expect(target).to.be.eql({ a: "one", b: '5', c: 1 })

        })
    })

    describe('getParameters()', function () {
        it('gets list of parameters from function definition', function () {
            var params = getParameters(function (param1: any, param2: any, ...param3: any[]) { })
            expect(params).to.eql(['param1', 'param2', '...param3'])
        })
    })

    describe('getOwnFunctions()', () => {
        it('return function names for object literal', () => {
            var obj = {
                a: 1,
                b: function () { }
            }
            expect(getOwnFunctions(obj)).to.an('array').to.eql(['b'])
        })

        it('return function names for class instance', () => {
            class A { method1() { return "A" } }
            class B extends A { method2() { return "B" } }
            class C extends B { method3() { return "C" } }
            var c = new C()

            expect(getOwnFunctions(c)).to.an('array').to.eql(['constructor', 'method3'])
        })
    })
})