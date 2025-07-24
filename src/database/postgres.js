const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { POSTGRES_SCHEMA, DROP_TABLE_SQL } = require('../schema');

class PostgresDB {
    constructor(connectionString) {
        // Modify connection string to handle SSL issues
        let modifiedConnectionString = connectionString;

        // Try to use the CA certificate if available
        try {
            const caPath = path.join(process.cwd(), 'ca.crt');
            if (fs.existsSync(caPath)) {
                const url = new URL(connectionString);
                url.searchParams.set('sslmode', 'require');
                url.searchParams.set('sslcert', '');
                url.searchParams.set('sslkey', '');
                url.searchParams.set('sslrootcert', caPath);
                modifiedConnectionString = url.toString();
            }
        } catch (error) {
            console.warn('Could not modify connection string for CA certificate');
        }

        this.pool = new Pool({
            connectionString: modifiedConnectionString,
            max: 20, // Maximum number of clients in the pool
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            ssl: { rejectUnauthorized: false } // Force accept all certificates for testing
        });
        
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle PostgreSQL client', err);
        });
    }

    async connect() {
        try {
            const client = await this.pool.connect();
            console.log('Connected to PostgreSQL successfully');
            client.release();
            return true;
        } catch (error) {
            console.error('Failed to connect to PostgreSQL:', error.message);
            throw error;
        }
    }

    async createTable() {
        try {
            await this.pool.query(POSTGRES_SCHEMA);
            console.log('PostgreSQL table created successfully');
        } catch (error) {
            console.error('Failed to create PostgreSQL table:', error.message);
            throw error;
        }
    }

    async dropTable() {
        try {
            await this.pool.query(DROP_TABLE_SQL);
            console.log('PostgreSQL table dropped successfully');
        } catch (error) {
            console.error('Failed to drop PostgreSQL table:', error.message);
            throw error;
        }
    }

    async insertMessage(data) {
        const query = `
            INSERT INTO llm_chat_message (user_id, role, title, message, config)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, timestamp
        `;
        
        try {
            const result = await this.pool.query(query, [
                data.user_id,
                data.role,
                data.title,
                data.message,
                data.config
            ]);
            return result.rows[0];
        } catch (error) {
            console.error('Failed to insert message into PostgreSQL:', error.message);
            throw error;
        }
    }

    async insertBatch(dataArray) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            
            const query = `
                INSERT INTO llm_chat_message (user_id, role, title, message, config)
                VALUES ($1, $2, $3, $4, $5)
            `;
            
            for (const data of dataArray) {
                await client.query(query, [
                    data.user_id,
                    data.role,
                    data.title,
                    data.message,
                    data.config
                ]);
            }
            
            await client.query('COMMIT');
            return dataArray.length;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Failed to insert batch into PostgreSQL:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async getMessagesByUser(userId, limit = 100) {
        const query = `
            SELECT id, timestamp, user_id, role, title, message, config
            FROM llm_chat_message
            WHERE user_id = $1
            ORDER BY timestamp DESC
            LIMIT $2
        `;
        
        try {
            const result = await this.pool.query(query, [userId, limit]);
            return result.rows;
        } catch (error) {
            console.error('Failed to get messages from PostgreSQL:', error.message);
            throw error;
        }
    }

    async getTableStats() {
        const query = `
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT user_id) as unique_users,
                MIN(timestamp) as earliest_message,
                MAX(timestamp) as latest_message
            FROM llm_chat_message
        `;
        
        try {
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Failed to get table stats from PostgreSQL:', error.message);
            throw error;
        }
    }

    async close() {
        await this.pool.end();
        console.log('PostgreSQL connection pool closed');
    }
}

module.exports = PostgresDB;
