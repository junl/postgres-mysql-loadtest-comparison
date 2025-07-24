/**
 * Database schema definitions for PostgreSQL and MySQL
 */

const POSTGRES_SCHEMA = `
CREATE TABLE IF NOT EXISTS llm_chat_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    config TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_id ON llm_chat_message (user_id);
CREATE INDEX IF NOT EXISTS idx_timestamp ON llm_chat_message (timestamp);
CREATE INDEX IF NOT EXISTS idx_role ON llm_chat_message (role);
`;

const MYSQL_SCHEMA = `
CREATE TABLE IF NOT EXISTS llm_chat_message (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    config TEXT NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_role (role)
);
`;

const DROP_TABLE_SQL = `DROP TABLE IF EXISTS llm_chat_message;`;

module.exports = {
    POSTGRES_SCHEMA,
    MYSQL_SCHEMA,
    DROP_TABLE_SQL
};
