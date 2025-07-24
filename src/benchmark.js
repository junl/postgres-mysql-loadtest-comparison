#!/usr/bin/env node

/**
 * Main benchmark script for PostgreSQL vs MySQL performance comparison
 */

const chalk = require('chalk');
require('dotenv').config();

const PostgresDB = require('./database/postgres');
const MySQLDB = require('./database/mysql');
const WriteTest = require('./tests/writeTest');
const ReadTest = require('./tests/readTest');
const PerformanceReporter = require('./utils/reporter');

async function runComprehensiveBenchmark() {
    console.log(chalk.bold.magenta('🚀 PostgreSQL vs MySQL Performance Benchmark'));
    console.log('='.repeat(80));
    console.log(chalk.gray(`Started at: ${new Date().toISOString()}`));
    
    const reporter = new PerformanceReporter();
    
    // Default configuration
    const config = {
        totalRecords: 1000000,
        batchSize: 20,
        concurrency: 10,
        userCount: 1000,
        readQueries: 10000,
        readLimit: 100,
        useBatchInsert: true
    };
    
    console.log(chalk.blue('\n📋 Test Configuration:'));
    console.log(chalk.gray(JSON.stringify(config, null, 2)));
    
    // Test both databases
    const databases = [
        { name: 'postgres', class: PostgresDB, connString: process.env.POSTGRES_CONN_STRING },
        { name: 'mysql', class: MySQLDB, connString: process.env.MYSQL_CONN_STRING }
    ];
    
    for (const { name, class: DbClass, connString } of databases) {
        if (!connString) {
            console.error(chalk.red(`❌ Missing connection string for ${name.toUpperCase()}`));
            continue;
        }
        
        try {
            console.log(chalk.bold.yellow(`\n🎯 Testing ${name.toUpperCase()}...`));
            
            const db = new DbClass(connString);
            await db.connect();
            
            // Setup table
            console.log(chalk.blue('🔧 Setting up table...'));
            await db.dropTable();
            await db.createTable();
            
            // Write test
            console.log(chalk.blue('\n📝 Running write performance test...'));
            const writeTest = new WriteTest(db, {
                totalRecords: config.totalRecords,
                batchSize: config.batchSize,
                concurrency: config.concurrency,
                userCount: config.userCount,
                useBatchInsert: config.useBatchInsert
            });
            
            const writeResults = await writeTest.run();
            reporter.addResults(name, 'write', writeResults);
            
            // Read test
            console.log(chalk.blue('\n📖 Running read performance test...'));
            const readTest = new ReadTest(db, {
                totalQueries: config.readQueries,
                concurrency: config.concurrency,
                userCount: config.userCount,
                readLimit: config.readLimit
            });
            
            const readResults = await readTest.run();
            reporter.addResults(name, 'read', readResults);
            
            await db.close();
            console.log(chalk.green(`✅ ${name.toUpperCase()} testing complete`));
            
        } catch (error) {
            console.error(chalk.red(`❌ Error testing ${name}: ${error.message}`));
            console.error(error.stack);
        }
    }
    
    // Generate comprehensive report
    console.log(chalk.bold.blue('\n📊 Generating performance report...'));
    reporter.generateCompleteReport();
    
    // Export results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-results-${timestamp}.json`;
    reporter.exportToJSON(filename);
    
    console.log(chalk.bold.green('\n🎉 Benchmark complete!'));
}

// Run the benchmark
if (require.main === module) {
    runComprehensiveBenchmark()
        .then(() => {
            console.log(chalk.green('Benchmark finished successfully'));
            process.exit(0);
        })
        .catch((error) => {
            console.error(chalk.red('Benchmark failed:'), error);
            process.exit(1);
        });
}

module.exports = { runComprehensiveBenchmark };
