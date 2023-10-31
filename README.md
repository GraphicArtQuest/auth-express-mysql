# auth-express-mysql

[![Licensed under the MIT License](https://img.shields.io/github/license/WayfindEntertainment/auth-express-mysql?color=blue)](LICENSE)
[![Contributions welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg?style=flat)](#contributions)

An [express-session](https://github.com/expressjs/session) store to manage [express.js](http://expressjs.com/) sessions with a MySQL database.

For added reliability and peace of mind, the `auth-express-mysql` testing suite has not only unit tests, but tests against an actual Express app by using the [supertest](https://github.com/ladjs/supertest) package.

-   [Installation](#installation)
-   [Using With Express Apps](#using-with-express-apps)
    -   [Using the AuthExpressStore Class](#using-the-authexpressstore-class)
    -   [Manually Running MySQL](#manually-running-sql)
    -   [Closing the Session Store](#closing-the-session-store)
-   [Config Options](#config-options)
    -   [Environment Variables](#environment-variables)
    -   [Config Object](#config-object)
    -   [Defaults](#defaults)
-   [Preventing Runtime Errors](#preventing-runtime-errors)
-   [Class Methods](#class-methods)
-   [Other Module Exports](#other-module-exports)
-   [Debugging in Your Own Projects](#debugging-in-your-own-projects)
-   [Contributing](#contributing)
    -   [Submit Issues](#submit-issues)
    -   [Propose New Features](#propose-new-features)
    -   [Submit a Pull Request](#submit-a-pull-request)
-   [Development Environment](#development-environment)
    -   [The MySQL Database](#the-mysql-database)
    -   [Scripts](#scripts)
-   [Credits](#credits)
-   [License](#license)

## Installation

Add to your express app using NPM.

```bash
npm install auth-express-mysql
```

## Using With Express Apps

This package provides implementation details for `express-session`. Below is an example of how to incorporate it into your app.

```javascript
const express = require('express')
const session = require('express-session')

const { AuthExpressStore } = require('auth-express-mysql')

const app = express()

const sessionStore = new AuthExpressStore()

app.use(
    session({
        store: sessionStore,
        name: 'sessionID',
        secret: 'my_session_secret',
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            secure: true,
            httpOnly: true,
            domain: process.env.HOST || 'localhost',
            maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
        }
    })
)
```

This will initialize the store using the default configuration.

The `AuthExpressStore` will **NOT** automatically create the `SESSIONS` table. You can create this table using one of two methods:

### Using the AuthExpressStore Class

```javascript
const sessionStore = new AuthExpressStore(configOptions)

sessionStore.createTable()
```

### Manually Running SQL

Using a tool such as phpMyAdmin, run the following SQL statement on your database:

```sql
CREATE TABLE IF NOT EXISTS SESSIONS
(SESSION_ID varchar(128) primary key not null,
EXPIRES bigint not null,
DATA mediumtext not null,
USER varchar(255) not null)`
```

### Closing the Session Store

There is no need to call any kind of closing method. Each call the store makes creates its own independent connection to the MySQL database and cleans up after itself. It will not leave hanging connections.

## Config Options

The class will initialize using configuration variables in the precedence of

1. Environment variables
2. A configuration object
3. Default values

This is not an all or nothing setup. For example, configuring a `.env` file with different values than a config object will cause the `.env` values to take precedence.

Specifying some values in `.env`, some in a config object, and omitting the rest to use the defaults will all load with no issues, assuming they are of appropriate data types.

### Environment Variables

The database connection variables can be set in a `.env` file for convenience. These variables would typically be kept in a file such as this anyway for connecting to the database for other elements.

```javascript
HOST: 'localhost'
DATABASE_PORT: 3306,
DATABASE_USER: 'auth_express_mysql_test_user',
DATABASE_PASSWORD: 'password123456',
DATABASE_NAME: 'auth_express_mysql_testing',
```

### Config Object

All the database variables can be configured within a javascript object. Additionally, you can change the table name and columns here if you so desire.

```javascript
const configOptions = {
        host: 'localhost'
        port: 3306,
        user: 'auth_express_mysql_test_user',
        password: 'password123456',
        database: 'auth_express_mysql_testing',
        tableName: 'SESSIONS',
        columnNames: {
            sessionID: 'SESSION_ID',
            expires: 'EXPIRES',
            data: 'DATA',
            user: 'USER'
        }
    }
```

### Defaults

If neither of these are found, the class initializes with the default values shown above.

## Preventing Runtime Errors

This session store class is designed to throw errors **ONLY** during initialization. It has basic type error checking to sanitize the configuration variables, but will not do things like database connectivity checks. This design descision means you will only exprience unhandled errors that will crash an Express app when it is starting, not when it is already in operation.

These errors are silently logged using the [debug](https://github.com/debug-js/debug) library, and the error message is returned to the callback functions for further handling as you see fit

## Class Methods

### `all(callback)`

Returns _all_ sessions in the store that not expired. Use the `expired` method to get only the unexpired sessions.

Returns: The data in a callback of form `callback(error, result)`

### `clear(callback)`

This method deletes _ALL_ sessions from the store. Use the `expiredClear` method to delete _only_ expired sessions.

-   Returns: The data in a callback of form `callback(error)`

### `destroy(sessionID, callback)`

Destroys the session with the given session ID.

-   Returns: The data in a callback of form `callback(error)`

### `get(sessionID, callback)`

Gets the session (if not expired) from the store given a session ID and passes it to callback.

The `session` argument should be a `Session` object if found, otherwise `null` or `undefined` if the session was not found and there was no error. A special case is made when `error.code === 'ENOENT'` to act like `callback(null, null)`.

-   Returns: The data in a callback of form `callback(error, sessionData)`

### `length(callback)`

This method returns _only_ the count of unexpired sessions. Use the `expiredLength` method count only expired sessions.

-   Returns: The data in a callback of form `callback(error, length)`

### `set(sessionID, session, callback)`

Upsert a session in the store given a session ID and SessionData. If the session already exists, ignore it. The `touch` function will handle updates.

-   Returns: The data in a callback of form `callback(error)`

### `touch(sessionID, session, callback)`

"Touches" a given session, resetting the idle timer.

-   Returns: The data in a callback of form `callback(error)`

### `expired(callback)`

Returns _only_ the expired sessions. Use the `all` method to get only the unexpired sessions.

-   Returns: The data in a callback of form `callback(error, result)`

### `expiredLength(callback)`

This method returns _only_ the count of expired sessions. Use the `length` method count only unexpired sessions.

-   Returns: The data in a callback of form `callback(error)`

### `expiredClear(callback)`

This method deletes _only_ the expired sessions. Use the `clear` to delete _all_ sessions.

-   Returns: The data in a callback of form `callback(error)`

### `destroyUser(user, callback)`

This method deletes _all sessions_, expired or not, for the specified user. Use the `destroy` method to delete a single session based on session ID. This method would typically be used to log a user out of all previously stored sessions across multiple devices.

-   Returns: The data in a callback of form `callback(error)`

### `createTable(callback)`

Creates the MySQL session table using the configuration provided during initialization. This is an optional method used to setup this table during runtime if not already done manually beforehand.

-   Returns: The data in a callback of form `callback(error)`

## Other Module Exports

The module also provides exposes the module's `debug` function, `databaseDefaults`, and `schemaDefaults`.

The debugging tool has three methods:

-   `debug.log`
-   `debug.error`
-   `debug.test`

`databaseDefaults` and `schemaDefaults` are javascript objects that contain the default configuration variables.

## Debugging in Your Own Projects

If you want to see the session store's debug messages while debugging your own project, turn them on with a package.json script such as this:

```json
"scripts": {
        "debug": "set DEBUG_COLORS=1 & set DEBUG_HIDE_DATE=1 & set DEBUG=auth-express-mysql:*,superagent,express-session & myAppScript"
    }
```

## Contributing

Contributions are welcome! Please help keep this project open and inclusive. Refer to the [Code of Conduct](https://github.com/WayfindEntertainment/.github/blob/main/CODE_OF_CONDUCT.md) before your first contribution.

Here are some ways you can contribute.

### Submit Issues

**Bug Reports**: Be as detailed as possible, and fill out all information requested in the [bug report template][choose issue].

_For security related issues, see the [security policy][security policy]._

**Documentation Requests**: Is something unclear in the documentation or the API? Submit a [documentation change request][choose issue]! Be as detailed as possible. If you have the question, chances are someone else will also who isn't as willing to speak up as you are.

### Propose New Features

Feature requests are welcome! Before submitting, take a moment to make sure your feature idea fits within the scope and aims of this project. See [`express-session` Store Implementation guidelines](https://github.com/expressjs/session#session-store-implementation) for more information on how this package must interface.

Be as detailed as possible when filling out a [new feature request][choose issue]. It is up to you to make your case of why the feature should get included!

**Please ask** before embarking on any significant undertaking by opening an issue for the proposal, otherwise you risk wasting time on something that might not fit well with the project.

### Submit a Pull Request

Good pull requests are outstanding help. They should remain focused in scope and avoid unrelated commits.

To submit a pull request,

1. Fork and clone the repository
1. Create a branch for your edits
1. Make sure your work follows the [Common Commit Guidance][wfe common commit] guidance

## Development Environment

This project uses a Node environment to help with linting, formatting, testing, and distribution. To install a local copy, clone the repository and install the dependencies:

```bash
git clone https://github.com/WayfindEntertainment/auth-express-mysql.git
cd auth-express-mysql
npm install
```

### The MySQL Database

The test suite executes against an active local MySQL database. You can host this on your own machine using a tool like [XAMPP](https://www.apachefriends.org/download.html). Configure the database with a user with read/write/create permissions, then update your configuration settings accordingly.

### Scripts

-   `npm run format`: Runs Prettier
-   `npm run lint`: Runs ESLint
-   `npm run test`: Executes all tests scripts using Jest while suppressing console output
-   `npm run debug`: Same as `test`, but allows debug info to write to the console
-   `npm run debug:watch`: Same as the `debug` script, but with Jest in watch mode

All commits must follow the Wayfind Entertainment [Common Commit Guidance][wfe common commit]. _This specification is inspired by and supersedes the [Angular Commit Message](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit)._ This project has no custom scopes.

## Credits

Many thanks to [Charles Hill](https://github.com/chill117) and his [express-mysql-session](https://github.com/chill117/express-mysql-session) package. `auth-express-mysql` is not a fork of `express-mysql-session`, but it would not exist without Charles's work to study and iterate on.

## License

To help as many fellow developers as possible, this package is distributed as free and open-source software under the [MIT](LICENSE) license.

[security policy]: https://github.com/WayfindEntertainment/auth-express-mysql/security/policy
[choose issue]: https://github.com/WayfindEntertainment/auth-express-mysql/issues/new/choose
[enhancements requested]: https://github.com/WayfindEntertainment/auth-express-mysql/labels/enhancement
[wfe common commit]: https://github.com/WayfindEntertainment/Common-Commit-Guidance
