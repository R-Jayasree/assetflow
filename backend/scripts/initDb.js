const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'sastra',
      multipleStatements: true
    });

    // Create database if not exists
    await connection.execute('CREATE DATABASE IF NOT EXISTS assetflow');
    await connection.execute('USE assetflow');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', '..', 'assetflow_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schema);

    console.log('✅ Database initialized successfully!');
    await connection.end();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDb();
