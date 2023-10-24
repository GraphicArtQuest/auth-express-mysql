/* eslint-disable global-require */
const { app } = require('./app')
const { debug } = require('../index')

const PORT = 4000

const server = app.listen(PORT, () => {
    debug.log(`Server running on port ${PORT}`)
})

module.exports = { server }
