# Usage Examples

## Quick Start

### 1. Setup Databases
```bash
# Setup both databases with fresh tables
node src/cli.js setup --drop
```

### 2. Run Small Test
```bash
# Quick test with 1000 records and 100 read queries
node src/cli.js benchmark --records 1000 --queries 100 --concurrency 5 --setup
```

### 3. Run Full Load Test
```bash
# Full scale test with 1M records (default)
node src/cli.js benchmark --setup --export results.json
```

## Individual Test Commands

### Write Performance Tests

```bash
# Test write performance with default settings (1M records)
node src/cli.js write

# Test specific database only
node src/cli.js write --database postgres --records 500000

# High concurrency test
node src/cli.js write --records 100000 --concurrency 20 --batch-size 50

# Use batch inserts for better performance
node src/cli.js write --records 50000 --batch-insert
```

### Read Performance Tests

```bash
# Test read performance with default settings (10K queries)
node src/cli.js read

# Test specific database with custom parameters
node src/cli.js read --database mysql --queries 5000 --concurrency 15

# Test with larger result sets
node src/cli.js read --queries 1000 --limit 500 --users 100
```

## Advanced Benchmarking

### Custom Configuration
```bash
# Comprehensive test with custom settings
node src/cli.js benchmark \
  --records 2000000 \
  --queries 20000 \
  --concurrency 15 \
  --batch-size 100 \
  --users 5000 \
  --limit 200 \
  --batch-insert \
  --setup \
  --export detailed-results.json
```

### Database-Specific Tests
```bash
# Test only PostgreSQL
node src/cli.js benchmark --database postgres --records 500000

# Test only MySQL
node src/cli.js benchmark --database mysql --records 500000
```

## Performance Tuning Examples

### High Throughput Write Test
```bash
# Optimized for maximum write throughput
node src/cli.js write \
  --records 1000000 \
  --batch-size 100 \
  --concurrency 20 \
  --batch-insert
```

### Low Latency Read Test
```bash
# Optimized for low latency reads
node src/cli.js read \
  --queries 10000 \
  --concurrency 5 \
  --limit 10 \
  --users 100
```

### Stress Test
```bash
# High load stress test
node src/cli.js benchmark \
  --records 5000000 \
  --queries 50000 \
  --concurrency 50 \
  --batch-size 200 \
  --users 10000 \
  --batch-insert
```

## Sample Results Interpretation

### Write Performance Results
```
📊 WRITE PERFORMANCE COMPARISON
┌────────────┬───────────────┬───────────────┬────────────┬──────────────────┐
│ Database   │ Total Records │ Total Time    │ TPS        │ Avg Latency (ms) │
├────────────┼───────────────┼───────────────┼────────────┼──────────────────┤
│ postgres   │ 1,000         │ 4,601         │ 217.34     │ 442.18           │
│ mysql      │ 1,000         │ 9,035         │ 110.68     │ 885.30           │
└────────────┴───────────────┴───────────────┴────────────┴──────────────────┘
🏆 Best Write Performance: postgres with 217.34 TPS
```

**Interpretation:**
- PostgreSQL achieved 2x higher write throughput (217 vs 111 TPS)
- PostgreSQL had 2x lower write latency (442ms vs 885ms)
- Both databases achieved 100% success rate

### Read Performance Results
```
📖 READ PERFORMANCE COMPARISON
┌────────────┬──────────────┬──────────────┬───────────────┬──────────┐
│ Database   │ Total Queries│ Records Read │ Total Time    │ QPS      │
├────────────┼──────────────┼──────────────┼───────────────┼──────────┤
│ postgres   │ 100          │ 92           │ 508           │ 196.85   │
│ mysql      │ 100          │ 101          │ 509           │ 196.46   │
└────────────┴──────────────┴──────────────┴───────────────┴──────────┘
🏆 Best Read Performance: postgres with 196.85 QPS
```

**Interpretation:**
- Read performance is nearly identical between databases
- Both achieved ~197 queries per second
- Similar latency characteristics for read operations

## Environment Variables

Make sure your `.env` file contains:
```env
POSTGRES_CONN_STRING="postgresql://user:password@host:port/database?sslmode=require"
MYSQL_CONN_STRING="mysql://user:password@host:port/database?ssl-mode=REQUIRED"
```

## Tips for Accurate Testing

1. **Use dedicated test databases** to avoid interference
2. **Run tests multiple times** and average results
3. **Monitor system resources** during tests
4. **Start with smaller tests** to verify setup
5. **Use batch inserts** for better write performance
6. **Adjust concurrency** based on your system capabilities

## Troubleshooting

### Connection Issues
```bash
# Test database connections
node src/cli.js setup
```

### Performance Issues
```bash
# Start with smaller test
node src/cli.js benchmark --records 100 --queries 50 --concurrency 2
```

### Memory Issues
```bash
# Reduce batch size and concurrency
node src/cli.js write --records 10000 --batch-size 10 --concurrency 2
```
