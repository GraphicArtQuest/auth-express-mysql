/* eslint-disable global-require */
const { SessionData, Store } = require('express-session')

const debug = {
    log: require('debug')('auth-express-mysql:log'),
    error: require('debug')('auth-express-mysql:error')
}

const databaseDefaults = {
    host: 'localhost',
    port: 3306,
    user: 'auth_express_mysql_test_user',
    password: 'password123456',
    database: 'auth_express_mysql_testing'
}

class AuthExpressStore extends Store {
    constructor(configOptions) {
        super()
        this.settings = {
            host: process.env.HOST || configOptions?.host || databaseDefaults.host,
            port: process.env.DATABASE_PORT || configOptions?.port || databaseDefaults.port,
            user: process.env.DATABASE_USER || configOptions?.user || databaseDefaults.user,
            password:
                process.env.DATABASE_PASSWORD ||
                configOptions?.password ||
                databaseDefaults.password,
            database:
                process.env.DATABASE_NAME || configOptions?.database || databaseDefaults.database,
            isAsync: configOptions?.isAsync || true
        }
    }
}

module.exports = { databaseDefaults, debug, AuthExpressStore }
