const request = require('supertest')

const { app } = require('../app')
const { debug } = require('../../index')

beforeEach(async () => {
    await debug.test(expect.getState().currentTestName)
})

test('App starts up successfully', async () => {
    const agent = request.agent(app)
    await agent.get('/').expect(302).expect('Location', '/login')
    await agent.get('/login').expect(200).expect('Login route')
})

test('Bad request gets 404', async () => {
    const agent = request.agent(app)
    await agent.get('/bad').expect(404).expect('Cannot find this page')
})

test('Not authenticated, route allows access to /notProtected', async () => {
    const agent = request.agent(app)
    await agent.get('/notProtected').expect(200).expect('Not Protected')
})

test('Not authenticated, route does NOT allow access to /protected', async () => {
    const agent = request.agent(app)
    await agent.get('/protected').expect(302).expect('Location', '/login')
})
