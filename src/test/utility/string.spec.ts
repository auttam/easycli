import { expect } from 'chai'
import * as stringUtil from '../../lib/utility/string'

describe('String Utils', function () {

    describe('hyphenate()', function () {

        it('converts "ThisWord" to "this-word"', function () {
            expect(stringUtil.hyphenate('ThisWord')).to.be.equal('this-word')
        });

        it('converts "thisWord" to "this-word"', function () {
            expect(stringUtil.hyphenate('thisWord')).to.be.equal('this-word')
        });

        it('converts "all the words in sentence" to "all-the-word-in-sentence"', function () {
            expect(stringUtil.hyphenate('all the words in sentence')).to.be.equal('all-the-words-in-sentence')
        });

        it('converts "this-newWord" to "this-new-word"', function () {
            expect(stringUtil.hyphenate('this-newWord')).to.be.equal('this-new-word')
        });

        it('converts "this_newWord" to "this-new-word"', function () {
            expect(stringUtil.hyphenate('this_newWord')).to.be.equal('this-new-word')
        });

        it('converts "THIS-WORD" to "t-h-i-s-w-o-r-d"', function () {
            expect(stringUtil.hyphenate('THIS-WORD')).to.be.equal('t-h-i-s-w-o-r-d')
        });

        it('converts "#20Park-wayDrive10001" to "#20-park-way-drive10001"', function () {
            expect(stringUtil.hyphenate('#20Park-wayDrive10001')).to.be.equal('#20-park-way-drive10001')
        });
    });

    describe('pascalCase()', function () {
        it('converts "myClass" to "MyClass"', function () {
            expect(stringUtil.pascalCase('myClass')).to.be.equal('MyClass')
        });

        it('converts "my-class" to "MyClass"', function () {
            expect(stringUtil.pascalCase('my-class')).to.be.equal('MyClass')
        });

        it('converts "my--class" to "MyClass"', function () {
            expect(stringUtil.pascalCase('my--class')).to.be.equal('MyClass')
        });

        it('converts "-my--class-" to "MyClass"', function () {
            expect(stringUtil.pascalCase('-my--class-')).to.be.equal('MyClass')
        });

        it('converts "my_class" to "MyClass"', function () {
            expect(stringUtil.pascalCase('my_class')).to.be.equal('MyClass')
        });

        it('converts "my__class_" to "MyClass"', function () {
            expect(stringUtil.pascalCase('my__class_')).to.be.equal('MyClass')
        });

        it('converts "_my__class_" to "MyClass"', function () {
            expect(stringUtil.pascalCase('_my__class_')).to.be.equal('MyClass')
        });

        it('converts "my.class" to "MyClass"', function () {
            expect(stringUtil.pascalCase('my.class')).to.be.equal('MyClass')
        });

        it('converts "my class" to "MyClass"', function () {
            expect(stringUtil.pascalCase('my class')).to.be.equal('MyClass')
        });

        it('converts "my, class" to "MyClass"', function () {
            expect(stringUtil.pascalCase('my, class')).to.be.equal('MyClass')
        });
    });

    describe('camelCase()', function () {
        it('converts "MyClass" to "myClass"', function () {
            expect(stringUtil.camelCase('MyClass')).to.be.equal('myClass')
        });

        it('converts "My-Class" to "myClass"', function () {
            expect(stringUtil.camelCase('My-Class')).to.be.equal('myClass')
        });

        it('converts "my-class" to "myClass"', function () {
            expect(stringUtil.camelCase('my-class')).to.be.equal('myClass')
        });

        it('converts "my--class" to "myClass"', function () {
            expect(stringUtil.camelCase('my--class')).to.be.equal('myClass')
        });

        it('converts "-my--class" to "myClass"', function () {
            expect(stringUtil.camelCase('-my--class')).to.be.equal('myClass')
        });

        it('converts "my_class" to "myClass"', function () {
            expect(stringUtil.camelCase('my_class')).to.be.equal('myClass')
        });

        it('converts "_my__class_" to "myClass"', function () {
            expect(stringUtil.camelCase('_my__class_')).to.be.equal('myClass')
        });

        it('converts "#20Park-wayDrive10001" to "#20ParkWayDrive10001"', function () {
            expect(stringUtil.camelCase('#20-park-way-drive10001')).to.be.equal('#20ParkWayDrive10001')
        });

    });

    describe('filterList()', function () {

        it('returns the list as-is when filter is not specified', function () {
            var list = ['apple', 'banana', 'orange', 'apple'];
            expect(stringUtil.filterList(list)).to.eql(list)
        });

        it('filters by word', function () {
            var list = ['apple', 'banana', 'orange', 'apple'];
            expect(stringUtil.filterList(list, 'apple'))
                .to.eql(['apple', 'apple'])
        });

        it('filters by an array of words', function () {
            var list = ['apple', 'banana', 'orange', 'apple'];
            expect(stringUtil.filterList(list, ['orange', 'banana']))
                .to.eql(['banana', 'orange'])
        });

        it('excludes filter.exclude items', function () {
            var list = ['apple', 'banana', 'orange', 'apple'];
            expect(stringUtil.filterList(list, {
                exclude: ['orange', 'apple']
            })).to.eql(['banana'])
        });

    });

    describe('separateWords()', function () {
        it('converts "HelloWorld" to "Hello World"', function () {
            expect(stringUtil.separateWords('HelloWorld')).to.be.equal('Hello World')
        });
        it('converts "hello-world" to "Hello World"', function () {
            expect(stringUtil.separateWords('hello-world')).to.be.equal('Hello World')
        });
        it('converts "hello world" to "Hello World"', function () {
            expect(stringUtil.separateWords('hello World')).to.be.equal('Hello World')
        });
    });

});
