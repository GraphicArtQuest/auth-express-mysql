const { AuthExpressStore } = require('../index')

const store = new AuthExpressStore()

store.connectToDatabase()
store.connection.query('DROP TABLE SESSIONS, TEST_SESSIONS', () => {
    store.closeDatabaseConnection()
})
