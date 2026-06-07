import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "smartinvestmentadvisor",
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Connection check with retry logic
const maxRetries = 5;
const retryDelay = 3000; // 3 seconds

const testConnection = async (retryCount = 1) => {
  try {
    const connection = await pool.promise().getConnection();
    console.log("✅ Connected to MySQL Database Pool successfully");
    connection.release();
  } catch (err) {
    console.error(`❌ Database connection attempt ${retryCount} failed: ${err.message}`);
    if (retryCount < maxRetries) {
      console.log(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      await testConnection(retryCount + 1);
    } else {
      console.error("🚨 Critical Error: Could not connect to MySQL database pool. Verify credentials and server status.");
    }
  }
};

// Initiate async connection check (non-blocking server boot)
testConnection();

export default pool;
