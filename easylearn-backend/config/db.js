// config/db.js
// Central MySQL connection pool for the EasyLearn AI backend.
// We use a pool instead of a single connection so concurrent
// requests don't block each other.

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// Quick sanity check on boot so a bad .env fails loudly
// instead of surfacing as a cryptic error deep in a route handler later.
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`Connected to MySQL database "${process.env.DB_NAME}"`);
    conn.release();
  } catch (err) {
    if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("DB auth failed — check DB_USER / DB_PASSWORD in .env");
    } else if (err.code === "ECONNREFUSED") {
      console.error("DB unreachable — is MySQL running and DB_HOST correct?");
    } else {
      console.error("Unexpected DB connection error:", err.message);
    }
  }
})();

module.exports = pool;