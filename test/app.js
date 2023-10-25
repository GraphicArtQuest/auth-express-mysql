const bodyParser = require('body-parser')
const express = require('express')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session')

const { databaseDefaults, debug } = require('../index')
const { AuthExpressStore } = require('../index')

/**
 * Checks if the user is not currently authenticated. If already authenticated, go to homepage. If not, continue.
 * @param {Function} req The request header
 * @param {Function} res The response action
 * @param {Function} next The callback function required by Express
 * @returns {void}
 */
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        debug.log('checkAuthenticated was successful')
        return next()
    }
    debug.log('checkAuthenticated was NOT successful')
    return res.redirect('/login')
}

/**
 * Checks if the user is not currently authenticated. If already authenticated, go to homepage. If not, continue.
 * @param {Function} req The request header
 * @param {Function} res The response action
 * @param {Function} next The callback function required by Express
 * @returns {void}
 */
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        debug.log('checkNotAuthenticated was successful')
        return res.redirect('/')
    }
    debug.log('checkNotAuthenticated was NOT successful')
    return next()
}

/**
 * Function solely for testing
 * @param {string} email Any string, but use 'good' for tests you want to pass.
 * @param {string} password Any string
 * @returns {boolean} `true` if simulating credentials correct, `false` otherwise
 */
function compareCredentials(email, password) {
    if (password === 'good') {
        return true
    }
    return false
}

/**
 * For testing purposes, initializes Passport
 * @param {object} passportInstance An instance of Passport
 * @returns {void}
 */
function initializePassport(passportInstance) {
    passportInstance.serializeUser((email, done) => {
        return done(null, email)
    })
    passportInstance.deserializeUser((email, done) => {
        return done(null, email)
    })

    passportInstance.use(
        'local',
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password',
                passReqToCallback: true // allows us to pass back the entire request to the callback
            },
            async function verify(req, email, password, done) {
                try {
                    const isAuthenticated = await compareCredentials(email, password)
                    if (isAuthenticated === true) {
                        return done(null, email)
                    }
                    return done(null, false, isAuthenticated.message)
                } catch (error) {
                    return done(null, false, error.message)
                }
            }
        )
    )
}

const app = express()
initializePassport(passport)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(
    session({
        store: new AuthExpressStore(),
        name: 'sessionID',
        secret: 'testing_secret',
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            secure: false,
            httpOnly: true,
            domain: process.env.HOST || databaseDefaults.host,
            maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
        }
    })
)

app.use(passport.initialize())
app.use(passport.session())

app.get('/', checkAuthenticated, (req, res) => {
    res.send('Successfully reached the / route')
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    debug.log('FINAL REQUEST COOKIE IN HEADER:', req.headers.cookie)
    res.send('Login route')
})

app.post(
    '/login',
    checkNotAuthenticated,
    async function authenticateMiddleware(req, res, next) {
        // eslint-disable-next-line consistent-return
        await passport.authenticate('local', async (err, user, errorMessage) => {
            debug.log('ATTEMPTING TO AUTHENTICATE', user)
            if (!user || errorMessage) {
                debug.log('THERE WAS AN ERROR:', errorMessage)
                if (req.userDetails) {
                    // We are dealing with an actual user account that failed authentication
                    debug.log(`Failed login attempt for user: '${req.body.email}'`)
                    return res
                        .status(401)
                        .send('Unable to authenticate with that email and password combination')
                }
                debug.log(`Unable to authenticate with that email and password combination`)
                return res
                    .status(401)
                    .send('Unable to authenticate with that email and password combination')
            }
            debug.log('SUCCESSFULLY AUTHENTICATED:', user)

            // There is an existing user, and this user has successfully authenticated. Log them in.
            debug.log('LOGGING IN USER')
            req.login(user, (error) => {
                debug.log('Attempting to login user with a unique sessionID...')
                if (error) {
                    debug.log(
                        `Uncaught error caught while attempting to login user '${user}'. ${error}`
                    )
                    return res.status(500).send('Uncaught error in login')
                }
                debug.log(`Logged in user '${req.user}', sessionID: ${req.sessionID}`)
                // await db.update('UPDATE USERS SET LOGIN_ATTEMPTS = ? WHERE EMAIL = ?', [0, req.user])
                return next()
            })
        })(req, res, next)
    },
    (req, res) => {
        debug.log('Redirecting to /protected route')
        res.redirect('/protected')
    }
)

app.get('/protected', checkAuthenticated, (req, res) => {
    res.redirect('/')
})

app.get('/notProtected', checkNotAuthenticated, (req, res) => {
    res.send('Not Protected')
})

app.use((req, res) => {
    res.status(404).send('Cannot find this page')
})

module.exports = { app }
