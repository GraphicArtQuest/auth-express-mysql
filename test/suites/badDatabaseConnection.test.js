/**
 * This module tests the system response when a bad database connection is present. In this module, it assumes invalid
 * credentials to initiate the MySQL connection error, but any error during this process will give the same result.
 */
process.env.DATABASE_PASSWORD = 'askldfjhalskdjfhalksjflkasjdhfalksjdhfhfhsfdajlkflaskdjfh'

const request = require('supertest')

const { AuthExpressStore, debug } = require('../../index')
const { app } = require('../app')

const sessionData = {
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

test('Should log an error without crashing the app if the database is not reachable', async () => {
    const goodCredentials = { email: 'test@test.com', password: 'good' }
    const agent = request.agent(app)

    await agent
        .post('/login')
        .send(goodCredentials)
        .expect(500)
        .then((res) => {
            expect(res.text).toMatch(/Uncaught error in login/)
        })
})

test('Attempting to set with bad database connection logs error without crashing the app', (done) => {
    const store = new AuthExpressStore()
    expect(() => {
        store.set('5qez7xPL2NmZST_1aexncI-DoIx_l4_e', sessionData, (res) => {
            expect(res).toBeInstanceOf(Error)
            done()
        })
    }).not.toThrow()
})

test('Attempting to get with bad database connection logs error without crashing the app', (done) => {
    const store = new AuthExpressStore()
    expect(() => {
        store.get('5qez7xPL2NmZST_1aexncI-DoIx_l4_e', (res) => {
            expect(res).toBeInstanceOf(Error)
            done()
        })
    }).not.toThrow()
})

test('Attempting to use all with bad database connection logs error without crashing the app', (done) => {
    const store = new AuthExpressStore()
    expect(() => {
        store.all((res) => {
            expect(res).toBeInstanceOf(Error)
            done()
        })
    }).not.toThrow()
})

test('Attempting to use clear with bad database connection logs error without crashing the app', (done) => {
    const store = new AuthExpressStore()
    expect(() => {
        store.clear((res) => {
            expect(res).toBeInstanceOf(Error)
            done()
        })
    }).not.toThrow()
})

test('Attempting to return length with bad database connection logs error without crashing the app', (done) => {
    const store = new AuthExpressStore()
    expect(() => {
        store.length((res) => {
            expect(res).toBeInstanceOf(Error)
            done()
        })
    }).not.toThrow()
})

test('Attempting to touch with bad database connection logs error without crashing the app', (done) => {
    const store = new AuthExpressStore()
    expect(() => {
        store.touch('abcd', sessionData, (res) => {
            expect(res).toBeInstanceOf(Error)
            done()
        })
    }).not.toThrow()
})

afterAll(() => {
    delete process.env.DATABASE_PASSWORD
})
