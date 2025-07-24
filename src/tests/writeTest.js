const { generateBatch } = require('../utils/dataGenerator');

/**
 * Write performance test implementation
 */
class WriteTest {
    constructor(database, config) {
        this.database = database;
        this.config = config;
        this.results = {
            totalRecords: 0,
            totalTime: 0,
            tps: 0,
            errors: 0,
            batches: [],
            avgLatency: 0,
            minLatency: Infinity,
            maxLatency: 0
        };
    }

    /**
     * Execute a single batch write operation
     */
    async executeBatch(batchData, batchIndex) {
        const startTime = Date.now();
        
        try {
            if (this.config.useBatchInsert) {
                await this.database.insertBatch(batchData);
            } else {
                // Insert records one by one
                for (const record of batchData) {
                    await this.database.insertMessage(record);
                }
            }
            
            const endTime = Date.now();
            const latency = endTime - startTime;
            
            return {
                batchIndex,
                recordCount: batchData.length,
                latency,
                success: true,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            const endTime = Date.now();
            const latency = endTime - startTime;
            
            console.error(`Batch ${batchIndex} failed:`, error.message);
            
            return {
                batchIndex,
                recordCount: batchData.length,
                latency,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Execute concurrent write operations
     */
    async runConcurrentWrites() {
        const { totalRecords, batchSize, concurrency, userCount } = this.config;
        const totalBatches = Math.ceil(totalRecords / batchSize);
        
        console.log(`Starting write test: ${totalRecords} records in ${totalBatches} batches with ${concurrency} concurrent workers`);
        
        const startTime = Date.now();
        let completedBatches = 0;
        let activeTasks = 0;
        const results = [];
        
        return new Promise((resolve, reject) => {
            const processBatch = async (batchIndex) => {
                if (batchIndex >= totalBatches) {
                    return;
                }
                
                activeTasks++;
                
                // Generate batch data
                const actualBatchSize = Math.min(batchSize, totalRecords - (batchIndex * batchSize));
                const batchData = generateBatch(actualBatchSize, userCount);
                
                try {
                    const result = await this.executeBatch(batchData, batchIndex);
                    results.push(result);
                    
                    if (result.success) {
                        completedBatches++;
                        this.results.totalRecords += result.recordCount;
                    } else {
                        this.results.errors++;
                    }
                    
                    // Update latency stats
                    this.results.minLatency = Math.min(this.results.minLatency, result.latency);
                    this.results.maxLatency = Math.max(this.results.maxLatency, result.latency);
                    
                    // Progress reporting
                    if (completedBatches % Math.max(1, Math.floor(totalBatches / 10)) === 0) {
                        const progress = (completedBatches / totalBatches * 100).toFixed(1);
                        console.log(`Progress: ${progress}% (${completedBatches}/${totalBatches} batches)`);
                    }
                    
                } catch (error) {
                    console.error(`Unexpected error in batch ${batchIndex}:`, error);
                    this.results.errors++;
                }
                
                activeTasks--;
                
                // Check if we're done
                if (completedBatches + this.results.errors >= totalBatches && activeTasks === 0) {
                    const endTime = Date.now();
                    this.results.totalTime = endTime - startTime;
                    this.results.tps = (this.results.totalRecords / this.results.totalTime) * 1000;
                    this.results.batches = results;
                    
                    // Calculate average latency
                    const successfulBatches = results.filter(r => r.success);
                    if (successfulBatches.length > 0) {
                        this.results.avgLatency = successfulBatches.reduce((sum, r) => sum + r.latency, 0) / successfulBatches.length;
                    }
                    
                    resolve(this.results);
                    return;
                }
                
                // Start next batch if available
                const nextBatchIndex = batchIndex + concurrency;
                if (nextBatchIndex < totalBatches) {
                    setImmediate(() => processBatch(nextBatchIndex));
                }
            };
            
            // Start initial concurrent batches
            for (let i = 0; i < Math.min(concurrency, totalBatches); i++) {
                setImmediate(() => processBatch(i));
            }
        });
    }

    /**
     * Run the complete write test
     */
    async run() {
        console.log('Starting write performance test...');
        
        try {
            const results = await this.runConcurrentWrites();
            
            console.log('\n=== Write Test Results ===');
            console.log(`Total Records: ${results.totalRecords}`);
            console.log(`Total Time: ${results.totalTime}ms`);
            console.log(`TPS (Transactions Per Second): ${results.tps.toFixed(2)}`);
            console.log(`Average Latency: ${results.avgLatency.toFixed(2)}ms`);
            console.log(`Min Latency: ${results.minLatency}ms`);
            console.log(`Max Latency: ${results.maxLatency}ms`);
            console.log(`Errors: ${results.errors}`);
            console.log(`Success Rate: ${((results.batches.filter(b => b.success).length / results.batches.length) * 100).toFixed(2)}%`);
            
            return results;
        } catch (error) {
            console.error('Write test failed:', error);
            throw error;
        }
    }
}

module.exports = WriteTest;
