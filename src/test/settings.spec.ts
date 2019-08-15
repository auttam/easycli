import { SettingStore, updateStore } from '../lib/settings'
const expect = require('chai').expect

// Tests for Setting Store
describe('Settings Store', () => {
    describe('updateStore()', () => {
        it('updates settings', () => {
            updateStore({
                mainMethod: 'changed'
            })
            expect(SettingStore.mainMethod).to.equal('changed')
        })
        
        it('doesn\'t update setting value has different type ', () => {
            var updateMock: any = updateStore
            expect(() => updateMock({
                mainMethod: 2
            })).to.throw()
        })

        it('updates nonCmdMethods setting ', () => {
            var initVal = SettingStore.nonCmdMethods || []
            updateStore({ nonCmdMethods: ['abc'] })
            expect(SettingStore.nonCmdMethods).to.include('abc')
            expect(SettingStore.nonCmdMethods).to.eql(['abc'].concat(initVal))
        })
    })
    it('is sealed', () => {
        expect(() => { delete SettingStore.mainMethod }).to.throw(TypeError)
        var settingMock: any = SettingStore
        expect(() => { settingMock["newProp"] = 1 }).to.throw(TypeError)
    })
})