#!/usr/bin/env node

/**
 * Database setup script
 */

const chalk = require('chalk');
require('dotenv').config();

const PostgresDB = require('./database/postgres');
const MySQLDB = require('./database/mysql');

async function setupDatabase(dbType, drop = false) {
    console.log(chalk.yellow(`\n🔧 Setting up ${dbType.toUpperCase()}...`));
    
    try {
        let db;
        if (dbType === 'postgres') {
            if (!process.env.POSTGRES_CONN_STRING) {
                throw new Error('POSTGRES_CONN_STRING environment variable is required');
            }
            db = new PostgresDB(process.env.POSTGRES_CONN_STRING);
        } else if (dbType === 'mysql') {
            if (!process.env.MYSQL_CONN_STRING) {
                throw new Error('MYSQL_CONN_STRING environment variable is required');
            }
            db = new MySQLDB(process.env.MYSQL_CONN_STRING);
        } else {
            throw new Error(`Unsupported database type: ${dbType}`);
        }
        
        await db.connect();
        
        if (drop) {
            console.log(chalk.red(`Dropping existing table in ${dbType}...`));
            await db.dropTable();
        }
        
        await db.createTable();
        console.log(chalk.green(`✅ ${dbType.toUpperCase()} setup complete`));
        
        await db.close();
        return true;
    } catch (error) {
        console.error(chalk.red(`❌ Failed to setup ${dbType}: ${error.message}`));
        return false;
    }
}

async function main() {
    console.log(chalk.bold.blue('🚀 Database Setup Script'));
    console.log('='.repeat(50));
    
    const args = process.argv.slice(2);
    const drop = args.includes('--drop');
    const dbType = args.find(arg => ['postgres', 'mysql'].includes(arg)) || 'both';
    
    console.log(chalk.gray(`Drop existing tables: ${drop}`));
    console.log(chalk.gray(`Database type: ${dbType}`));
    
    const databases = dbType === 'both' ? ['postgres', 'mysql'] : [dbType];
    
    let allSuccess = true;
    for (const db of databases) {
        const success = await setupDatabase(db, drop);
        if (!success) {
            allSuccess = false;
        }
    }
    
    if (allSuccess) {
        console.log(chalk.bold.green('\n🎉 All databases setup successfully!'));
        process.exit(0);
    } else {
        console.log(chalk.bold.red('\n❌ Some databases failed to setup'));
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error(chalk.red('Setup failed:'), error);
        process.exit(1);
    });
}
