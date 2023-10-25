/* eslint-disable global-require */
const createDebug = require('debug')
const mysql = require('mysql')
const { Store } = require('express-session')

const debug = {
    log: createDebug('auth-express-mysql:log'),
    error: createDebug('auth-express-mysql:error'),
    test: createDebug('auth-express-mysql:RUNNING TEST -')
}
debug.test.color = 10

const databaseDefaults = {
    host: 'localhost',
    port: 3306,
    user: 'auth_express_mysql_test_user',
    password: 'password123456',
    database: 'auth_express_mysql_testing'
}

const schemaDefaults = {
    tableName: 'SESSIONS',
    columnNames: {
        sessionID: 'SESSION_ID',
        expires: 'EXPIRES',
        data: 'DATA',
        user: 'USER'
    }
}

const createTableStatements = `CREATE TABLE SESSIONS (
        SESSION_ID varchar(128) primary key not null,
        EXPIRES bigint not null,
        DATA mediumtext not null,
        USER varchar(255) not null
    )`

class AuthExpressStore extends Store {
    constructor(configOptions) {
        super()
        this.settings = {
            databaseConfig: {
                host: process.env.HOST || configOptions?.host || databaseDefaults.host,
                port: process.env.DATABASE_PORT || configOptions?.port || databaseDefaults.port,
                user: process.env.DATABASE_USER || configOptions?.user || databaseDefaults.user,
                password:
                    process.env.DATABASE_PASSWORD ||
                    configOptions?.password ||
                    databaseDefaults.password,
                database:
                    process.env.DATABASE_NAME ||
                    configOptions?.database ||
                    databaseDefaults.database
            },
            isAsync: configOptions?.isAsync || true,
            tableName: configOptions?.tableName || schemaDefaults.tableName,
            columnNames: {
                SESSION_ID: configOptions?.columnNames?.sessionID || 'SESSION_ID',
                EXPIRES: configOptions?.columnNames?.expires || 'EXPIRES',
                DATA: configOptions?.columnNames?.data || 'DATA',
                USER: configOptions?.columnNames?.user || 'USER'
            }
        }

        debug.log('AuthExpressStore successfully initialized')
    }

    connectToDatabase() {
        this.connection = mysql.createConnection({
            host: this.settings.databaseConfig.host,
            user: this.settings.databaseConfig.user,
            password: this.settings.databaseConfig.password,
            database: this.settings.databaseConfig.database,
            port: this.settings.databaseConfig.port
        })
        this.connection.connect((err) => {
            if (err) {
                debug.error('Unable to connect to the database')
                throw err
            }
            debug.log('Successfully connected to the database')
        })
    }

    closeDatabaseConnection() {
        this.connection.destroy()
        debug.log('Successfully closed the database connection')
    }

    /**
     * Shuts down the database connection to avoid lingering processes, then executes the callback function the user
     * specified. If no callback was given, or the callback was not a function, an empty callback will get used insetad.
     * @param {Function} callback The callback function
     * @param {string} error The error string, if applicable
     * @param {object} data the data to return, if applicable
     * @returns {void}
     */
    finalCallback(callback, error, data) {
        if (typeof callback !== 'function') {
            // eslint-disable-next-line no-param-reassign, func-names
            callback = function () {}
        }
        this.closeDatabaseConnection()
        callback(error, data)
    }

    all(callback) {
        return callback()
    }

    clear(callback) {
        return callback()
    }

    destroy(sessionID, callback) {
        const sql = 'DELETE FROM ?? WHERE ?? = ?'
        const params = [this.settings.tableName, this.settings.columnNames.SESSION_ID, sessionID]
        this.connectToDatabase()
        this.connection.query(sql, params, (error, result) => {
            if (error) {
                debug.error(`Session ${sessionID} cannot be deleted: ${error.message}`)
                this.finalCallback(callback, error)
            }
            debug.log(
                `Session ${sessionID} successfully destroyed. Client result: ${JSON.stringify(
                    result
                )}`
            )

            return this.finalCallback(callback, error)
        })
    }

    get(sessionID, callback) {
        const sql = 'SELECT ?? FROM ?? WHERE ?? = ?'
        const params = [
            this.settings.columnNames.DATA,
            this.settings.tableName,
            this.settings.columnNames.SESSION_ID,
            sessionID
        ]
        this.connectToDatabase()
        this.connection.query(sql, params, (error, result) => {
            if (error) {
                debug.log(`Session ${sessionID} cannot be fetched: ${error.message}`)
                return this.finalCallback(callback, error)
            }

            if (result.length === 1) {
                debug.log(
                    `Session ${sessionID} successfully fetched. Data: ${JSON.stringify(result[0])}`
                )
                const sessionData = JSON.parse(result[0].DATA)
                return this.finalCallback(callback, error, sessionData)
            }
            return this.finalCallback(callback, error)
        })
    }

    length(callback) {
        return callback()
    }

    set(sessionID, session, callback) {
        const sessionData = JSON.stringify(session)
        const timeExpires = null // new Date(session.cookie.expires)
        const sql =
            'INSERT INTO ?? (??, ??, ??, ??) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE ?? = ?, ?? = ?'
        const params = [
            this.settings.tableName,
            this.settings.columnNames.SESSION_ID,
            this.settings.columnNames.DATA,
            this.settings.columnNames.EXPIRES,
            this.settings.columnNames.USER,
            sessionID,
            sessionData,
            timeExpires,
            String(session.passport.user),
            this.settings.columnNames.DATA,
            sessionData,
            this.settings.columnNames.EXPIRES,
            timeExpires
        ]

        this.connectToDatabase()
        this.connection.query(sql, params, async (error, result) => {
            if (error) {
                debug.error(`Session ID ${sessionID} cannot be created: ${error.message}`)
            } else {
                debug.log(`Session ID ${sessionID} successfully added to store: ${sessionData}`)
                debug.log(`Client result: ${JSON.stringify(result)}`)
            }
            return this.finalCallback(callback, error)
        })
    }

    touch(sessionID, session, callback) {
        return callback()
    }
}

module.exports = { databaseDefaults, debug, AuthExpressStore }
