const { AuthExpressStore, databaseDefaults, debug } = require('../../index')

beforeEach(async () => {
    await debug.test(expect.getState().currentTestName)
})

test('Calling new instance with default should create a new class with default config', async () => {
    const store = new AuthExpressStore()
    expect(store).toBeInstanceOf(AuthExpressStore)

    expect(store.settings.databaseConfig.host).toEqual(databaseDefaults.host)
    expect(store.settings.databaseConfig.port).toEqual(databaseDefaults.port)
    expect(store.settings.databaseConfig.user).toEqual(databaseDefaults.user)
    expect(store.settings.databaseConfig.password).toEqual(databaseDefaults.password)
    expect(store.settings.databaseConfig.database).toEqual(databaseDefaults.database)
})

test('Calling new instance with good environtment variables should create a new class using that environment', async () => {
    process.env.HOST = 'non-localhost'
    process.env.DATABASE_PORT = 1234
    process.env.DATABASE_USER = 'my_user'
    process.env.DATABASE_PASSWORD = 'another_password'
    process.env.DATABASE_NAME = 'the_database_name'
    const store = new AuthExpressStore()

    expect(store.settings.databaseConfig.host).toEqual('non-localhost')
    expect(store.settings.databaseConfig.port).toEqual(1234)
    expect(store.settings.databaseConfig.user).toEqual('my_user')
    expect(store.settings.databaseConfig.password).toEqual('another_password')
    expect(store.settings.databaseConfig.database).toEqual('the_database_name')
})

test('Calling new instance with configOption variables should create a new class using that configuration', async () => {
    const store = new AuthExpressStore({
        host: 'existent_host',
        port: 2345,
        user: 'another_user',
        password: 'yet_another_password',
        database: 'some_database'
    })

    expect(store.settings.databaseConfig.host).toEqual('existent_host')
    expect(store.settings.databaseConfig.port).toEqual(2345)
    expect(store.settings.databaseConfig.user).toEqual('another_user')
    expect(store.settings.databaseConfig.password).toEqual('yet_another_password')
    expect(store.settings.databaseConfig.database).toEqual('some_database')
})

test.each([1, true, toString, ['This is not a string'], { host: 'an object in an object' }])(
    'Calling new instance with bad configOption.host = %p should throw an error',
    async (input) => {
        expect(() => {
            // eslint-disable-next-line no-unused-vars
            const store = new AuthExpressStore({
                host: input
            })
        }).toThrow(/The database host must be a string. Received: /)
    }
)

test.each(['one', true, toString, [4567], { port: 1234 }])(
    'Calling new instance with bad configOption.port = %p should throw an error',
    async (input) => {
        expect(() => {
            // eslint-disable-next-line no-unused-vars
            const store = new AuthExpressStore({
                port: input
            })
        }).toThrow(/The database port must be coercible to an integer. Received: /)
    }
)

test.each([1, true, toString, ['This is not a string'], { user: 'an object in an object' }])(
    'Calling new instance with bad configOption.user = %p should throw an error',
    async (input) => {
        expect(() => {
            // eslint-disable-next-line no-unused-vars
            const store = new AuthExpressStore({
                user: input
            })
        }).toThrow(/The database user must be a string. Received: /)
    }
)

test.each([1, true, toString, ['This is not a string'], { password: 'password' }])(
    'Calling new instance with bad configOption.password = %p should throw an error',
    async (input) => {
        expect(() => {
            // eslint-disable-next-line no-unused-vars
            const store = new AuthExpressStore({
                password: input
            })
        }).toThrow(/The database user password must be a string. Received: /)
    }
)

test.each([1, true, toString, ['This is not a string'], { database: 'databaseName' }])(
    'Calling new instance with bad configOption.database = %p should throw an error',
    async (input) => {
        expect(() => {
            // eslint-disable-next-line no-unused-vars
            const store = new AuthExpressStore({
                database: input
            })
        }).toThrow(/The database name must be a string. Received: /)
    }
)

test.each([1, true, toString, ['This is not a string'], { database: 'databaseName' }])(
    'Calling new instance with bad configOption.tableName = %p should throw an error',
    async (input) => {
        expect(() => {
            // eslint-disable-next-line no-unused-vars
            const store = new AuthExpressStore({
                tableName: input
            })
        }).toThrow(/The session table name must be a string. Received: /)
    }
)

test.each([1, true, toString, ['This is not a string'], { database: 'databaseName' }])(
    'Calling new instance with bad configOption.columnNames.sessionID = %p should throw an error',
    async (input) => {
        expect(() => {
            // eslint-disable-next-line no-unused-vars
            const store = new AuthExpressStore({
                columnNames: { sessionID: input }
            })
        }).toThrow(/The table column name for (.*?) must be a string. Received: /)
    }
)

afterEach(() => {
    delete process.env.HOST
    delete process.env.DATABASE_PORT
    delete process.env.DATABASE_USER
    delete process.env.DATABASE_PASSWORD
    delete process.env.DATABASE_NAME
})
