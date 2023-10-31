/**
 * This module tests a basic express application using the server store. This gives confidence that the store will
 * work in intended production environments.
 */
const request = require('supertest')

const { app } = require('../app')
const { debug } = require('../../index')

beforeEach(async () => {
    await debug.test(expect.getState().currentTestName)
})

test('Passport successfully authenticates and cookie can be saved', async () => {
    const goodCredentials = { email: 'test@test.com', password: 'good' }
    const agent = request.agent(app)
    await agent.get('/').expect(302).expect('Location', '/login')
    let cookie

    await agent
        .post('/login')
        .send(goodCredentials)
        .expect(302)
        .expect('set-cookie', /sessionID/)
        .expect('Location', '/protected')
        .then((res) => {
            // eslint-disable-next-line prefer-destructuring
            cookie = res.header['set-cookie'][0]
        })

    await agent.set('Cookie', cookie).get('/').expect(200)
    await agent.get('/protected').set('Cookie', cookie).expect(302).expect('Location', '/')
    await agent.get('/notProtected').set('Cookie', cookie).expect(302).expect('Location', '/')
})

test('Bad credentials do not work', async () => {
    const badCredentials = { email: 'test@test.com', password: 'bad' }
    const agent = request.agent(app)
    await agent.post('/login').send(badCredentials).expect(401)
})

test('GET / after the Express session limit days of not logging in requires another login authentication.', async () => {
    jest.clearAllMocks()

    const goodCredentials = { email: 'test@test.com', password: 'good' }

    const agent = request.agent(app)
    let cookie

    // Must first successfully log in
    await agent
        .post('/login')
        .send(goodCredentials)
        .expect(302)
        .expect('Location', '/protected')
        .expect('set-cookie', /sessionID=/)
        .then((res) => {
            // eslint-disable-next-line prefer-destructuring
            cookie = res.header['set-cookie'][0]
            agent.jar.setCookie(cookie)
        })

    await agent.get('/').set('Cookie', cookie).expect(200)

    jest.useFakeTimers('modern')
    jest.setSystemTime(
        Date.now() + 14 * 24 * 60 * 60 * 1000 + 1000 // Matches the 14 day max cookie limit + 1 seconds
    )

    await agent.get('/').set('Cookie', cookie).expect(302).expect('Location', '/login')
    jest.useRealTimers()
    jest.clearAllMocks()
})
