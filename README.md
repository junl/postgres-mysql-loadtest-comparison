# PostgreSQL vs MySQL Load Test Comparison

A comprehensive performance comparison tool for PostgreSQL and MySQL databases, designed to test write and read performance under high load conditions.

## Features

- **Identical Schema**: Both databases use the exact same table structure for fair comparison
- **Concurrent Operations**: Configurable concurrency levels for realistic load testing
- **Comprehensive Metrics**: TPS, QPS, latency percentiles, and detailed performance analysis
- **Flexible Configuration**: Customizable record counts, batch sizes, and test parameters
- **Rich Reporting**: Colorful CLI output with detailed comparison tables and charts
- **Export Results**: JSON export for further analysis

## Table Schema

The test uses a `llm_chat_message` table with the following structure:

```sql
- id: UUID (Primary Key)
- timestamp: Timestamp with timezone
- user_id: VARCHAR(255) - Indexed
- role: VARCHAR(50) - Indexed  
- title: VARCHAR(500)
- message: TEXT (minimum 1500 characters)
- config: TEXT (minimum 1500 characters)
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables in `.env`:
```env
POSTGRES_CONN_STRING="postgresql://user:password@host:port/database"
MYSQL_CONN_STRING="mysql://user:password@host:port/database"
```

## Usage

### Quick Start - Full Benchmark

Run a complete benchmark with default settings (1M records, 10K read queries):

```bash
npm run benchmark
```

Or with custom parameters:

```bash
node src/cli.js benchmark --records 500000 --queries 5000 --concurrency 20 --setup
```

### Individual Commands

#### Setup Database Tables

```bash
# Setup both databases
node src/cli.js setup

# Setup specific database
node src/cli.js setup --database postgres
node src/cli.js setup --database mysql

# Drop and recreate tables
node src/cli.js setup --drop
```

#### Write Performance Test

```bash
# Test both databases
node src/cli.js write --records 1000000 --batch-size 20 --concurrency 10

# Test specific database
node src/cli.js write --database postgres --records 500000

# Use batch inserts for better performance
node src/cli.js write --batch-insert
```

#### Read Performance Test

```bash
# Test both databases
node src/cli.js read --queries 10000 --concurrency 10 --limit 100

# Test specific database
node src/cli.js read --database mysql --queries 5000
```

## Configuration Options

### Write Test Options

- `--records, -n`: Total number of records to insert (default: 1000000)
- `--batch-size, -b`: Batch size for inserts (default: 20)
- `--concurrency, -c`: Number of concurrent workers (default: 10)
- `--users, -u`: Number of unique users (default: 1000)
- `--batch-insert`: Use batch insert instead of individual inserts

### Read Test Options

- `--queries, -q`: Total number of queries to execute (default: 10000)
- `--concurrency, -c`: Number of concurrent workers (default: 10)
- `--users, -u`: Number of unique users (default: 1000)
- `--limit, -l`: Maximum records per query (default: 100)

### General Options

- `--database, -d`: Database type (postgres, mysql, both) (default: both)
- `--export`: Export results to JSON file
- `--setup`: Setup tables before running tests

## Example Output

```
🚀 DATABASE PERFORMANCE COMPARISON REPORT
================================================================================

📊 WRITE PERFORMANCE COMPARISON
============================================================
┌────────────┬───────────────┬───────────────┬────────────┬──────────────────┬──────────────────┬──────────────────┬────────┬────────────────┐
│ Database   │ Total Records │ Total Time    │ TPS        │ Avg Latency (ms) │ Min Latency (ms) │ Max Latency (ms) │ Errors │ Success Rate   │
├────────────┼───────────────┼───────────────┼────────────┼──────────────────┼──────────────────┼──────────────────┼────────┼────────────────┤
│ postgres   │ 1,000,000     │ 45,234        │ 22,108.45  │ 452.34           │ 123              │ 2,456            │ 0      │ 100.00%        │
├────────────┼───────────────┼───────────────┼────────────┼──────────────────┼──────────────────┼──────────────────┼────────┼────────────────┤
│ mysql      │ 1,000,000     │ 52,891        │ 18,906.78  │ 528.91           │ 145              │ 3,123            │ 0      │ 100.00%        │
└────────────┴───────────────┴───────────────┴────────────┴──────────────────┴──────────────────┴──────────────────┴────────┴────────────────┘

🏆 Best Write Performance: postgres with 22,108.45 TPS
```

## Performance Metrics

The tool measures and reports:

- **TPS (Transactions Per Second)**: Write operations per second
- **QPS (Queries Per Second)**: Read operations per second  
- **Latency**: Min, max, average, and percentile latencies (P50, P95, P99)
- **Success Rate**: Percentage of successful operations
- **Throughput**: Total records processed
- **Error Rate**: Number and percentage of failed operations

## Architecture

```
src/
├── cli.js              # Command-line interface
├── benchmark.js        # Main benchmark script
├── schema.js           # Database schema definitions
├── database/
│   ├── postgres.js     # PostgreSQL connection and operations
│   └── mysql.js        # MySQL connection and operations
├── tests/
│   ├── writeTest.js    # Write performance test implementation
│   └── readTest.js     # Read performance test implementation
└── utils/
    ├── dataGenerator.js # Random data generation utilities
    └── reporter.js      # Performance reporting and comparison
```

## Requirements

- Node.js 16+
- PostgreSQL database with connection access
- MySQL database with connection access
- Sufficient disk space for test data

## Tips for Accurate Testing

1. **Use dedicated test databases** to avoid interference
2. **Run tests multiple times** and average results
3. **Monitor system resources** during tests
4. **Use similar hardware specs** for both databases
5. **Clear caches** between test runs if needed
6. **Consider network latency** for remote databases

## Troubleshooting

### Connection Issues
- Verify connection strings in `.env` file
- Check database server accessibility
- Ensure proper SSL configuration

### Performance Issues
- Reduce concurrency if hitting connection limits
- Adjust batch sizes based on available memory
- Monitor database server resources

### Memory Issues
- Reduce total record count for testing
- Increase batch size to reduce memory overhead
- Monitor Node.js heap usage

## License

MIT License
