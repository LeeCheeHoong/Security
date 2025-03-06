const { Pool } = require('pg');

// Configure the PostgreSQL pool
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
