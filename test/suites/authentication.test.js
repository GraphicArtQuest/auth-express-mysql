const request = require('supertest')

const { app } = require('../app')
const { debug } = require('../../index')

test('Passport successfully authenticates and cookie can be saved', async () => {
    await debug.test('Passport successfully authenticates and cookie can be saved')
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

    await agent.get('/').set('Cookie', cookie).expect(200)
    await agent.get('/protected').set('Cookie', cookie).expect(302).expect('Location', '/')
    await agent.get('/notProtected').set('Cookie', cookie).expect(302).expect('Location', '/')
})

test('Bad credentials do not work', async () => {
    await debug.test('Bad credentials do not work')
    const badCredentials = { email: 'test@test.com', password: 'bad' }
    const agent = request.agent(app)
    await agent.post('/login').send(badCredentials).expect(401)
})
