const { getRandomUserId } = require('../utils/dataGenerator');

/**
 * Read performance test implementation
 */
class ReadTest {
    constructor(database, config) {
        this.database = database;
        this.config = config;
        this.results = {
            totalQueries: 0,
            totalRecordsRead: 0,
            totalTime: 0,
            qps: 0, // Queries per second
            errors: 0,
            queries: [],
            avgLatency: 0,
            minLatency: Infinity,
            maxLatency: 0,
            avgRecordsPerQuery: 0
        };
    }

    /**
     * Execute a single read query
     */
    async executeQuery(userId, queryIndex) {
        const startTime = Date.now();
        
        try {
            const messages = await this.database.getMessagesByUser(userId, this.config.readLimit);
            const endTime = Date.now();
            const latency = endTime - startTime;
            
            return {
                queryIndex,
                userId,
                recordCount: messages.length,
                latency,
                success: true,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            const endTime = Date.now();
            const latency = endTime - startTime;
            
            console.error(`Query ${queryIndex} failed:`, error.message);
            
            return {
                queryIndex,
                userId,
                recordCount: 0,
                latency,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Execute concurrent read operations
     */
    async runConcurrentReads() {
        const { totalQueries, concurrency, userCount, readLimit } = this.config;
        
        console.log(`Starting read test: ${totalQueries} queries with ${concurrency} concurrent workers, max ${readLimit} records per query`);
        
        const startTime = Date.now();
        let completedQueries = 0;
        let activeTasks = 0;
        const results = [];
        
        return new Promise((resolve, reject) => {
            const processQuery = async (queryIndex) => {
                if (queryIndex >= totalQueries) {
                    return;
                }
                
                activeTasks++;
                
                // Generate random user ID for the query
                const userId = getRandomUserId(userCount);
                
                try {
                    const result = await this.executeQuery(userId, queryIndex);
                    results.push(result);
                    
                    if (result.success) {
                        completedQueries++;
                        this.results.totalRecordsRead += result.recordCount;
                    } else {
                        this.results.errors++;
                    }
                    
                    // Update latency stats
                    this.results.minLatency = Math.min(this.results.minLatency, result.latency);
                    this.results.maxLatency = Math.max(this.results.maxLatency, result.latency);
                    
                    // Progress reporting
                    if (completedQueries % Math.max(1, Math.floor(totalQueries / 10)) === 0) {
                        const progress = (completedQueries / totalQueries * 100).toFixed(1);
                        console.log(`Progress: ${progress}% (${completedQueries}/${totalQueries} queries)`);
                    }
                    
                } catch (error) {
                    console.error(`Unexpected error in query ${queryIndex}:`, error);
                    this.results.errors++;
                }
                
                activeTasks--;
                
                // Check if we're done
                if (completedQueries + this.results.errors >= totalQueries && activeTasks === 0) {
                    const endTime = Date.now();
                    this.results.totalTime = endTime - startTime;
                    this.results.totalQueries = completedQueries;
                    this.results.qps = (this.results.totalQueries / this.results.totalTime) * 1000;
                    this.results.queries = results;
                    
                    // Calculate average latency and records per query
                    const successfulQueries = results.filter(r => r.success);
                    if (successfulQueries.length > 0) {
                        this.results.avgLatency = successfulQueries.reduce((sum, r) => sum + r.latency, 0) / successfulQueries.length;
                        this.results.avgRecordsPerQuery = this.results.totalRecordsRead / successfulQueries.length;
                    }
                    
                    resolve(this.results);
                    return;
                }
                
                // Start next query if available
                const nextQueryIndex = queryIndex + concurrency;
                if (nextQueryIndex < totalQueries) {
                    setImmediate(() => processQuery(nextQueryIndex));
                }
            };
            
            // Start initial concurrent queries
            for (let i = 0; i < Math.min(concurrency, totalQueries); i++) {
                setImmediate(() => processQuery(i));
            }
        });
    }

    /**
     * Get database statistics before running read test
     */
    async getPreTestStats() {
        try {
            const stats = await this.database.getTableStats();
            console.log('\n=== Pre-Read Test Database Stats ===');
            console.log(`Total Records: ${stats.total_records}`);
            console.log(`Unique Users: ${stats.unique_users}`);
            console.log(`Earliest Message: ${stats.earliest_message}`);
            console.log(`Latest Message: ${stats.latest_message}`);
            return stats;
        } catch (error) {
            console.error('Failed to get pre-test stats:', error);
            return null;
        }
    }

    /**
     * Run the complete read test
     */
    async run() {
        console.log('Starting read performance test...');
        
        try {
            // Get database stats first
            await this.getPreTestStats();
            
            const results = await this.runConcurrentReads();
            
            console.log('\n=== Read Test Results ===');
            console.log(`Total Queries: ${results.totalQueries}`);
            console.log(`Total Records Read: ${results.totalRecordsRead}`);
            console.log(`Total Time: ${results.totalTime}ms`);
            console.log(`QPS (Queries Per Second): ${results.qps.toFixed(2)}`);
            console.log(`Average Latency: ${results.avgLatency.toFixed(2)}ms`);
            console.log(`Min Latency: ${results.minLatency}ms`);
            console.log(`Max Latency: ${results.maxLatency}ms`);
            console.log(`Average Records Per Query: ${results.avgRecordsPerQuery.toFixed(2)}`);
            console.log(`Errors: ${results.errors}`);
            console.log(`Success Rate: ${((results.queries.filter(q => q.success).length / results.queries.length) * 100).toFixed(2)}%`);
            
            return results;
        } catch (error) {
            console.error('Read test failed:', error);
            throw error;
        }
    }
}

module.exports = ReadTest;
