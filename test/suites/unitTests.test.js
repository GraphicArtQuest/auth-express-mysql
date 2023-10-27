/**
 * This module executes unit based tests that exist outside of an Express app. They do, however, rely on the MySQL
 * database running successfully, but they are not integration tests.
 */

const { randomUUID } = require('crypto')

const { AuthExpressStore, debug } = require('../../index')

const sampleSessionID = randomUUID()
const sampleSessionData = {
    cookie: {
        originalMaxAge: 1209600000,
        expires: new Date(Date.now() + 1209600000),
        secure: false,
        httpOnly: true,
        domain: 'localhost',
        path: '/'
    },
    passport: { user: 'test@test.com' }
}

/**
 * Helper function to create valid session details
 * @param {string} email Optional email to use
 * @param {number} expireTime Optional time this will expire
 * @returns {object} Details for adding
 */
function getSessionDetails(
    email = `${randomUUID()}@test.com`,
    expireTime = Date.now() + 1209600000
) {
    return {
        sessionID: randomUUID(),
        sessionData: {
            cookie: {
                originalMaxAge: 1209600000,
                expires: new Date(expireTime),
                secure: false,
                httpOnly: true,
                domain: 'localhost',
                path: '/'
            },
            passport: { user: email }
        },
        expireTime,
        email
    }
}

beforeEach(() => {
    debug.test(expect.getState().currentTestName)
})

test('SET and GET will successfully add and retrieve, respectively, from database', (done) => {
    const store = new AuthExpressStore()

    store.clear(() => {
        store.set(sampleSessionID, sampleSessionData, () => {
            store.get(sampleSessionID, (err, data) => {
                expect(data).toStrictEqual(sampleSessionData)
                done()
            })
        })
    })
})

test('GET non-existant session will not throw an error', (done) => {
    const store = new AuthExpressStore()

    expect(async () => {
        store.clear(() => {
            store.get(sampleSessionID, (err, data) => {
                expect(data).toBe(undefined)
                done()
            })
        })
    }).not.toThrow()
})

test('DESTROY will successfully remove session from database', (done) => {
    const store = new AuthExpressStore()

    store.clear(() => {
        store.set(sampleSessionID, sampleSessionData, () => {
            store.destroy(sampleSessionID, (err, data) => {
                expect(data).toBe(undefined)
                done()
            })
        })
    })
})

test('DESTROY non-existant session will not throw an error', (done) => {
    const store = new AuthExpressStore()

    expect(async () => {
        store.clear(() => {
            store.destroy(sampleSessionID, (err, data) => {
                expect(data).toBe(undefined)
                done()
            })
        })
    }).not.toThrow()
})

test('ALL returns an array of all existing sessions that are not expired', (done) => {
    const store = new AuthExpressStore()

    // Ensured only 5 sessions present, with 2 of them expired.
    const session1 = getSessionDetails()
    const session2 = getSessionDetails()
    const session3 = getSessionDetails()
    const session4 = getSessionDetails(undefined, Date.now() - 100)
    const session5 = getSessionDetails(undefined, Date.now() - 100)

    store.clear(async () => {
        store.set(session1.sessionID, session1.sessionData, async () => {
            store.set(session2.sessionID, session2.sessionData, async () => {
                store.set(session3.sessionID, session3.sessionData, async () => {
                    store.set(session4.sessionID, session4.sessionData, async () => {
                        store.set(session5.sessionID, session5.sessionData, async () => {
                            store.all(async (err2, data) => {
                                expect(Array.isArray(data)).toBeTruthy()
                                expect(data).toHaveLength(3)
                                done()
                            })
                        })
                    })
                })
            })
        })
    })
})

test('CLEAR removes all sessions from the store', (done) => {
    const store = new AuthExpressStore()

    const session1 = getSessionDetails()
    const session2 = getSessionDetails()
    const session3 = getSessionDetails()
    const session4 = getSessionDetails(undefined, Date.now() - 100)

    store.set(session1.sessionID, session1.sessionData, async () => {
        store.set(session2.sessionID, session2.sessionData, async () => {
            store.set(session3.sessionID, session3.sessionData, async () => {
                store.set(session4.sessionID, session4.sessionData, async () => {
                    store.clear(async () => {
                        store.all(async (err2, data) => {
                            expect(data).toHaveLength(0)
                            done()
                        })
                    })
                })
            })
        })
    })
})
