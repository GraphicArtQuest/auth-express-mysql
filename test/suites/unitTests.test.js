/**
 * This module executes unit based tests that exist outside of an Express app. They do, however, rely on the MySQL
 * database running successfully, but they are not integration tests.
 */

const { AuthExpressStore, debug } = require('../../index')

const sampleSessionID = '5qez7xPL2NmZST_1aexncI-DoIx_l4_e'
const sampleSessionData = {
    cookie: {
        originalMaxAge: 1209600000,
        expires: '2023-11-09T15:40:55.188Z',
        secure: false,
        httpOnly: true,
        domain: 'localhost',
        path: '/'
    },
    passport: { user: 'test@test.com' }
}

beforeEach(() => {
    debug.test(expect.getState().currentTestName)
})

test('SET will successfully write to database', (done) => {
    const store = new AuthExpressStore()
    expect(() => {
        store.set(sampleSessionID, sampleSessionData, (err) => {
            expect(err).toBe(null)
            done()
        })
    }).not.toThrow()
})

test('SET will successfully write to database, no callback works successfully', () => {
    const store = new AuthExpressStore()

    expect(() => {
        store.set(sampleSessionID, sampleSessionData)
    }).not.toThrow()
})

test('GET will successfully retrieve from databasea', (done) => {
    const store = new AuthExpressStore()
    expect(async () => {
        // First, guarantee this session is in there
        store.set(sampleSessionID, sampleSessionData, () => {
            store.get(sampleSessionID, (err, data) => {
                expect(data).toStrictEqual(sampleSessionData)
                done()
            })
        })
    }).not.toThrow()
})

test('GET non-existant session will not throw an error', (done) => {
    const store = new AuthExpressStore()
    expect(async () => {
        store.get(`non_existent${sampleSessionID}`, (err, data) => {
            expect(data).toBe(undefined)
            done()
        })
    }).not.toThrow()
})

test('DESTROY will successfully remove session from database', (done) => {
    const store = new AuthExpressStore()
    expect(async () => {
        // First, guarantee this session is in there
        store.set(sampleSessionID, sampleSessionData, () => {
            store.destroy(sampleSessionID, (err, data) => {
                expect(data).toBe(undefined)
                done()
            })
        })
    }).not.toThrow()
})

test('DESTROY non-existant session will not throw an error', (done) => {
    const store = new AuthExpressStore()
    expect(async () => {
        store.destroy(`non_existent${sampleSessionID}`, (err, data) => {
            expect(data).toBe(undefined)
            done()
        })
    }).not.toThrow()
})
