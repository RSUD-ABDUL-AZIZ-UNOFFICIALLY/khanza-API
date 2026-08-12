require('dotenv').config();
const {
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    DB_HOST,
    DB_DIALECT
} = process.env;

module.exports = {
    "development": {
        "username": DB_USERNAME,
        "password": DB_PASSWORD,
        "database": DB_NAME,
        "host": DB_HOST,
        "dialect": DB_DIALECT,
        "pool": {
            "maxConnections": 10,
            "maxIdleTime": 30000,
            "minIdleTime": 10000,
            "acquireTimeout": 30000
        },
    },
    "test": {
        "username": DB_USERNAME,
        "password": DB_PASSWORD,
        "database": DB_NAME,
        "host": DB_HOST,
        "dialect": DB_DIALECT
    },
    "production": {
        "username": DB_USERNAME,
        "password": DB_PASSWORD,
        "database": DB_NAME,
        "host": DB_HOST,
        "dialect": DB_DIALECT
    }
};
