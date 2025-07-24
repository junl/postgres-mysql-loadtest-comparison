const mysql = require('mysql2/promise');
const { MYSQL_SCHEMA, DROP_TABLE_SQL } = require('../schema');

class MySQLDB {
    constructor(connectionString) {
        // Parse MySQL connection string
        const url = new URL(connectionString);
        
        this.config = {
            host: url.hostname,
            port: url.port || 3306,
            user: url.username,
            password: url.password,
            database: url.pathname.slice(1), // Remove leading slash
            ssl: url.searchParams.get('ssl-mode') === 'REQUIRED' ? {
                rejectUnauthorized: false // Accept self-signed certificates
            } : false,
            connectionLimit: 20
        };
        
        this.pool = mysql.createPool(this.config);
    }

    async connect() {
        try {
            const connection = await this.pool.getConnection();
            console.log('Connected to MySQL successfully');
            connection.release();
            return true;
        } catch (error) {
            console.error('Failed to connect to MySQL:', error.message);
            throw error;
        }
    }

    async createTable() {
        try {
            await this.pool.execute(MYSQL_SCHEMA);
            console.log('MySQL table created successfully');
        } catch (error) {
            console.error('Failed to create MySQL table:', error.message);
            throw error;
        }
    }

    async dropTable() {
        try {
            await this.pool.execute(DROP_TABLE_SQL);
            console.log('MySQL table dropped successfully');
        } catch (error) {
            console.error('Failed to drop MySQL table:', error.message);
            throw error;
        }
    }

    async insertMessage(data) {
        const query = `
            INSERT INTO llm_chat_message (user_id, role, title, message, config)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        try {
            const [result] = await this.pool.execute(query, [
                data.user_id,
                data.role,
                data.title,
                data.message,
                data.config
            ]);
            
            // Get the inserted record
            const [rows] = await this.pool.execute(
                'SELECT id, timestamp FROM llm_chat_message WHERE id = LAST_INSERT_ID()'
            );
            return rows[0];
        } catch (error) {
            console.error('Failed to insert message into MySQL:', error.message);
            throw error;
        }
    }

    async insertBatch(dataArray) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const query = `
                INSERT INTO llm_chat_message (user_id, role, title, message, config)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            for (const data of dataArray) {
                await connection.execute(query, [
                    data.user_id,
                    data.role,
                    data.title,
                    data.message,
                    data.config
                ]);
            }
            
            await connection.commit();
            return dataArray.length;
        } catch (error) {
            await connection.rollback();
            console.error('Failed to insert batch into MySQL:', error.message);
            throw error;
        } finally {
            connection.release();
        }
    }

    async getMessagesByUser(userId, limit = 100) {
        // MySQL doesn't allow binding LIMIT parameter, so we need to construct the query
        const query = `
            SELECT id, timestamp, user_id, role, title, message, config
            FROM llm_chat_message
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT ${parseInt(limit)}
        `;

        try {
            const [rows] = await this.pool.execute(query, [userId]);
            return rows;
        } catch (error) {
            console.error('Failed to get messages from MySQL:', error.message);
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
            const [rows] = await this.pool.execute(query);
            return rows[0];
        } catch (error) {
            console.error('Failed to get table stats from MySQL:', error.message);
            throw error;
        }
    }

    async close() {
        await this.pool.end();
        console.log('MySQL connection pool closed');
    }
}

module.exports = MySQLDB;
