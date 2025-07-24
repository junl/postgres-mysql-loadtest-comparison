const Table = require('cli-table3');
const chalk = require('chalk');

/**
 * Performance reporting utilities
 */
class PerformanceReporter {
    constructor() {
        this.results = {};
    }

    /**
     * Add test results for a database
     */
    addResults(dbName, testType, results) {
        if (!this.results[dbName]) {
            this.results[dbName] = {};
        }
        this.results[dbName][testType] = results;
    }

    /**
     * Generate comparison report for write tests
     */
    generateWriteComparison() {
        const databases = Object.keys(this.results);
        if (databases.length < 2) {
            console.log(chalk.yellow('Need at least 2 databases to compare'));
            return;
        }

        console.log(chalk.bold.blue('\n📊 WRITE PERFORMANCE COMPARISON'));
        console.log('='.repeat(60));

        const table = new Table({
            head: [
                chalk.cyan('Database'),
                chalk.cyan('Total Records'),
                chalk.cyan('Total Time (ms)'),
                chalk.cyan('TPS'),
                chalk.cyan('Avg Latency (ms)'),
                chalk.cyan('Min Latency (ms)'),
                chalk.cyan('Max Latency (ms)'),
                chalk.cyan('Errors'),
                chalk.cyan('Success Rate (%)')
            ],
            colWidths: [12, 15, 15, 12, 18, 18, 18, 8, 16]
        });

        let bestTPS = 0;
        let bestDatabase = '';

        databases.forEach(dbName => {
            const writeResults = this.results[dbName].write;
            if (writeResults) {
                const successRate = writeResults.batches ? 
                    ((writeResults.batches.filter(b => b.success).length / writeResults.batches.length) * 100).toFixed(2) : 
                    '0.00';

                table.push([
                    dbName,
                    writeResults.totalRecords.toLocaleString(),
                    writeResults.totalTime.toLocaleString(),
                    writeResults.tps.toFixed(2),
                    writeResults.avgLatency.toFixed(2),
                    writeResults.minLatency,
                    writeResults.maxLatency,
                    writeResults.errors,
                    successRate
                ]);

                if (writeResults.tps > bestTPS) {
                    bestTPS = writeResults.tps;
                    bestDatabase = dbName;
                }
            }
        });

        console.log(table.toString());
        
        if (bestDatabase) {
            console.log(chalk.green.bold(`🏆 Best Write Performance: ${bestDatabase} with ${bestTPS.toFixed(2)} TPS`));
        }
    }

    /**
     * Generate comparison report for read tests
     */
    generateReadComparison() {
        const databases = Object.keys(this.results);
        if (databases.length < 2) {
            console.log(chalk.yellow('Need at least 2 databases to compare'));
            return;
        }

        console.log(chalk.bold.blue('\n📖 READ PERFORMANCE COMPARISON'));
        console.log('='.repeat(60));

        const table = new Table({
            head: [
                chalk.cyan('Database'),
                chalk.cyan('Total Queries'),
                chalk.cyan('Records Read'),
                chalk.cyan('Total Time (ms)'),
                chalk.cyan('QPS'),
                chalk.cyan('Avg Latency (ms)'),
                chalk.cyan('Min Latency (ms)'),
                chalk.cyan('Max Latency (ms)'),
                chalk.cyan('Avg Records/Query'),
                chalk.cyan('Errors'),
                chalk.cyan('Success Rate (%)')
            ],
            colWidths: [12, 14, 14, 15, 10, 18, 18, 18, 18, 8, 16]
        });

        let bestQPS = 0;
        let bestDatabase = '';

        databases.forEach(dbName => {
            const readResults = this.results[dbName].read;
            if (readResults) {
                const successRate = readResults.queries ? 
                    ((readResults.queries.filter(q => q.success).length / readResults.queries.length) * 100).toFixed(2) : 
                    '0.00';

                table.push([
                    dbName,
                    readResults.totalQueries.toLocaleString(),
                    readResults.totalRecordsRead.toLocaleString(),
                    readResults.totalTime.toLocaleString(),
                    readResults.qps.toFixed(2),
                    readResults.avgLatency.toFixed(2),
                    readResults.minLatency,
                    readResults.maxLatency,
                    readResults.avgRecordsPerQuery.toFixed(2),
                    readResults.errors,
                    successRate
                ]);

                if (readResults.qps > bestQPS) {
                    bestQPS = readResults.qps;
                    bestDatabase = dbName;
                }
            }
        });

        console.log(table.toString());
        
        if (bestDatabase) {
            console.log(chalk.green.bold(`🏆 Best Read Performance: ${bestDatabase} with ${bestQPS.toFixed(2)} QPS`));
        }
    }

    /**
     * Generate overall performance summary
     */
    generateOverallSummary() {
        console.log(chalk.bold.magenta('\n🎯 OVERALL PERFORMANCE SUMMARY'));
        console.log('='.repeat(60));

        const databases = Object.keys(this.results);
        
        databases.forEach(dbName => {
            console.log(chalk.bold.white(`\n${dbName.toUpperCase()}:`));
            
            const writeResults = this.results[dbName].write;
            const readResults = this.results[dbName].read;
            
            if (writeResults) {
                console.log(chalk.green(`  Write TPS: ${writeResults.tps.toFixed(2)}`));
                console.log(chalk.green(`  Write Avg Latency: ${writeResults.avgLatency.toFixed(2)}ms`));
            }
            
            if (readResults) {
                console.log(chalk.blue(`  Read QPS: ${readResults.qps.toFixed(2)}`));
                console.log(chalk.blue(`  Read Avg Latency: ${readResults.avgLatency.toFixed(2)}ms`));
            }
        });

        // Performance ratio analysis
        if (databases.length === 2) {
            const [db1, db2] = databases;
            const db1Write = this.results[db1].write;
            const db2Write = this.results[db2].write;
            const db1Read = this.results[db1].read;
            const db2Read = this.results[db2].read;

            console.log(chalk.bold.yellow('\n📈 PERFORMANCE RATIOS:'));
            
            if (db1Write && db2Write) {
                const writeRatio = (db1Write.tps / db2Write.tps).toFixed(2);
                console.log(`  Write TPS Ratio (${db1}/${db2}): ${writeRatio}x`);
            }
            
            if (db1Read && db2Read) {
                const readRatio = (db1Read.qps / db2Read.qps).toFixed(2);
                console.log(`  Read QPS Ratio (${db1}/${db2}): ${readRatio}x`);
            }
        }
    }

    /**
     * Generate detailed latency analysis
     */
    generateLatencyAnalysis() {
        console.log(chalk.bold.cyan('\n⏱️  LATENCY ANALYSIS'));
        console.log('='.repeat(60));

        const databases = Object.keys(this.results);
        
        databases.forEach(dbName => {
            console.log(chalk.bold.white(`\n${dbName.toUpperCase()}:`));
            
            const writeResults = this.results[dbName].write;
            const readResults = this.results[dbName].read;
            
            if (writeResults && writeResults.batches) {
                const latencies = writeResults.batches.filter(b => b.success).map(b => b.latency);
                if (latencies.length > 0) {
                    latencies.sort((a, b) => a - b);
                    const p50 = latencies[Math.floor(latencies.length * 0.5)];
                    const p95 = latencies[Math.floor(latencies.length * 0.95)];
                    const p99 = latencies[Math.floor(latencies.length * 0.99)];
                    
                    console.log(chalk.green('  Write Latency Percentiles:'));
                    console.log(chalk.green(`    P50: ${p50}ms`));
                    console.log(chalk.green(`    P95: ${p95}ms`));
                    console.log(chalk.green(`    P99: ${p99}ms`));
                }
            }
            
            if (readResults && readResults.queries) {
                const latencies = readResults.queries.filter(q => q.success).map(q => q.latency);
                if (latencies.length > 0) {
                    latencies.sort((a, b) => a - b);
                    const p50 = latencies[Math.floor(latencies.length * 0.5)];
                    const p95 = latencies[Math.floor(latencies.length * 0.95)];
                    const p99 = latencies[Math.floor(latencies.length * 0.99)];
                    
                    console.log(chalk.blue('  Read Latency Percentiles:'));
                    console.log(chalk.blue(`    P50: ${p50}ms`));
                    console.log(chalk.blue(`    P95: ${p95}ms`));
                    console.log(chalk.blue(`    P99: ${p99}ms`));
                }
            }
        });
    }

    /**
     * Generate complete performance report
     */
    generateCompleteReport() {
        console.log(chalk.bold.magenta('\n🚀 DATABASE PERFORMANCE COMPARISON REPORT'));
        console.log('='.repeat(80));
        console.log(chalk.gray(`Generated at: ${new Date().toISOString()}`));
        
        this.generateWriteComparison();
        this.generateReadComparison();
        this.generateLatencyAnalysis();
        this.generateOverallSummary();
        
        console.log(chalk.bold.green('\n✅ Performance comparison complete!'));
        console.log('='.repeat(80));
    }

    /**
     * Export results to JSON
     */
    exportToJSON(filename = 'performance-results.json') {
        const fs = require('fs');
        const exportData = {
            timestamp: new Date().toISOString(),
            results: this.results
        };
        
        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
        console.log(chalk.green(`📄 Results exported to ${filename}`));
    }
}

module.exports = PerformanceReporter;
