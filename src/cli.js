#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
require('dotenv').config();

const PostgresDB = require('./database/postgres');
const MySQLDB = require('./database/mysql');
const WriteTest = require('./tests/writeTest');
const ReadTest = require('./tests/readTest');
const PerformanceReporter = require('./utils/reporter');
const { generateTestConfig } = require('./utils/dataGenerator');

const program = new Command();

program
    .name('db-loadtest')
    .description('PostgreSQL vs MySQL performance comparison tool')
    .version('1.0.0');

program
    .command('setup')
    .description('Setup database tables')
    .option('-d, --database <type>', 'Database type (postgres, mysql, both)', 'both')
    .option('--drop', 'Drop existing tables before creating new ones', false)
    .action(async (options) => {
        await setupDatabases(options);
    });

program
    .command('write')
    .description('Run write performance test')
    .option('-d, --database <type>', 'Database type (postgres, mysql, both)', 'both')
    .option('-n, --records <number>', 'Total number of records to insert', '1000000')
    .option('-b, --batch-size <number>', 'Batch size for inserts', '20')
    .option('-c, --concurrency <number>', 'Number of concurrent workers', '10')
    .option('-u, --users <number>', 'Number of unique users', '1000')
    .option('--batch-insert', 'Use batch insert instead of individual inserts', false)
    .action(async (options) => {
        await runWriteTest(options);
    });

program
    .command('read')
    .description('Run read performance test')
    .option('-d, --database <type>', 'Database type (postgres, mysql, both)', 'both')
    .option('-q, --queries <number>', 'Total number of queries to execute', '10000')
    .option('-c, --concurrency <number>', 'Number of concurrent workers', '10')
    .option('-u, --users <number>', 'Number of unique users', '1000')
    .option('-l, --limit <number>', 'Maximum records per query', '100')
    .action(async (options) => {
        await runReadTest(options);
    });

program
    .command('benchmark')
    .description('Run complete benchmark (write + read tests)')
    .option('-d, --database <type>', 'Database type (postgres, mysql, both)', 'both')
    .option('-n, --records <number>', 'Total number of records to insert', '1000000')
    .option('-b, --batch-size <number>', 'Batch size for inserts', '20')
    .option('-c, --concurrency <number>', 'Number of concurrent workers', '10')
    .option('-u, --users <number>', 'Number of unique users', '1000')
    .option('-q, --queries <number>', 'Total number of read queries', '10000')
    .option('-l, --limit <number>', 'Maximum records per read query', '100')
    .option('--batch-insert', 'Use batch insert instead of individual inserts', false)
    .option('--setup', 'Setup tables before running tests', false)
    .option('--export <filename>', 'Export results to JSON file')
    .action(async (options) => {
        await runBenchmark(options);
    });

async function createDatabaseConnection(type) {
    if (type === 'postgres') {
        if (!process.env.POSTGRES_CONN_STRING) {
            throw new Error('POSTGRES_CONN_STRING environment variable is required');
        }
        return new PostgresDB(process.env.POSTGRES_CONN_STRING);
    } else if (type === 'mysql') {
        if (!process.env.MYSQL_CONN_STRING) {
            throw new Error('MYSQL_CONN_STRING environment variable is required');
        }
        return new MySQLDB(process.env.MYSQL_CONN_STRING);
    } else {
        throw new Error(`Unsupported database type: ${type}`);
    }
}

async function setupDatabases(options) {
    const databases = options.database === 'both' ? ['postgres', 'mysql'] : [options.database];
    
    console.log(chalk.blue('🔧 Setting up databases...'));
    
    for (const dbType of databases) {
        try {
            console.log(chalk.yellow(`\nSetting up ${dbType.toUpperCase()}...`));
            
            const db = await createDatabaseConnection(dbType);
            await db.connect();
            
            if (options.drop) {
                console.log(chalk.red(`Dropping existing table in ${dbType}...`));
                await db.dropTable();
            }
            
            await db.createTable();
            console.log(chalk.green(`✅ ${dbType.toUpperCase()} setup complete`));
            
            await db.close();
        } catch (error) {
            console.error(chalk.red(`❌ Failed to setup ${dbType}: ${error.message}`));
        }
    }
}

async function runWriteTest(options) {
    const databases = options.database === 'both' ? ['postgres', 'mysql'] : [options.database];
    const reporter = new PerformanceReporter();
    
    const config = {
        totalRecords: parseInt(options.records),
        batchSize: parseInt(options.batchSize),
        concurrency: parseInt(options.concurrency),
        userCount: parseInt(options.users),
        useBatchInsert: options.batchInsert
    };
    
    console.log(chalk.blue('✍️  Starting write performance tests...'));
    console.log(chalk.gray(`Config: ${JSON.stringify(config, null, 2)}`));
    
    for (const dbType of databases) {
        try {
            console.log(chalk.yellow(`\n📝 Testing ${dbType.toUpperCase()} write performance...`));
            
            const db = await createDatabaseConnection(dbType);
            await db.connect();
            
            const writeTest = new WriteTest(db, config);
            const results = await writeTest.run();
            
            reporter.addResults(dbType, 'write', results);
            
            await db.close();
        } catch (error) {
            console.error(chalk.red(`❌ Write test failed for ${dbType}: ${error.message}`));
        }
    }
    
    if (databases.length > 1) {
        reporter.generateWriteComparison();
    }
}

async function runReadTest(options) {
    const databases = options.database === 'both' ? ['postgres', 'mysql'] : [options.database];
    const reporter = new PerformanceReporter();
    
    const config = {
        totalQueries: parseInt(options.queries),
        concurrency: parseInt(options.concurrency),
        userCount: parseInt(options.users),
        readLimit: parseInt(options.limit)
    };
    
    console.log(chalk.blue('📖 Starting read performance tests...'));
    console.log(chalk.gray(`Config: ${JSON.stringify(config, null, 2)}`));
    
    for (const dbType of databases) {
        try {
            console.log(chalk.yellow(`\n📚 Testing ${dbType.toUpperCase()} read performance...`));
            
            const db = await createDatabaseConnection(dbType);
            await db.connect();
            
            const readTest = new ReadTest(db, config);
            const results = await readTest.run();
            
            reporter.addResults(dbType, 'read', results);
            
            await db.close();
        } catch (error) {
            console.error(chalk.red(`❌ Read test failed for ${dbType}: ${error.message}`));
        }
    }
    
    if (databases.length > 1) {
        reporter.generateReadComparison();
    }
}

async function runBenchmark(options) {
    const databases = options.database === 'both' ? ['postgres', 'mysql'] : [options.database];
    const reporter = new PerformanceReporter();
    
    console.log(chalk.bold.magenta('🚀 Starting comprehensive database benchmark...'));
    
    // Setup if requested
    if (options.setup) {
        await setupDatabases({ database: options.database, drop: true });
    }
    
    // Write test configuration
    const writeConfig = {
        totalRecords: parseInt(options.records),
        batchSize: parseInt(options.batchSize),
        concurrency: parseInt(options.concurrency),
        userCount: parseInt(options.users),
        useBatchInsert: options.batchInsert
    };
    
    // Read test configuration
    const readConfig = {
        totalQueries: parseInt(options.queries),
        concurrency: parseInt(options.concurrency),
        userCount: parseInt(options.users),
        readLimit: parseInt(options.limit)
    };
    
    // Run tests for each database
    for (const dbType of databases) {
        try {
            console.log(chalk.bold.yellow(`\n🎯 Benchmarking ${dbType.toUpperCase()}...`));
            
            const db = await createDatabaseConnection(dbType);
            await db.connect();
            
            // Write test
            console.log(chalk.blue(`\n📝 Running write test for ${dbType}...`));
            const writeTest = new WriteTest(db, writeConfig);
            const writeResults = await writeTest.run();
            reporter.addResults(dbType, 'write', writeResults);
            
            // Read test
            console.log(chalk.blue(`\n📖 Running read test for ${dbType}...`));
            const readTest = new ReadTest(db, readConfig);
            const readResults = await readTest.run();
            reporter.addResults(dbType, 'read', readResults);
            
            await db.close();
            
            console.log(chalk.green(`✅ ${dbType.toUpperCase()} benchmark complete`));
            
        } catch (error) {
            console.error(chalk.red(`❌ Benchmark failed for ${dbType}: ${error.message}`));
        }
    }
    
    // Generate comprehensive report
    reporter.generateCompleteReport();
    
    // Export results if requested
    if (options.export) {
        reporter.exportToJSON(options.export);
    }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error(chalk.red('Uncaught Exception:'), error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
    process.exit(1);
});

program.parse();
