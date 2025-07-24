const { v4: uuidv4 } = require('uuid');

/**
 * Utility functions for generating random test data
 */

const ROLES = ['user', 'assistant', 'system', 'function'];

const SAMPLE_WORDS = [
    'artificial', 'intelligence', 'machine', 'learning', 'neural', 'network', 'algorithm', 'data',
    'science', 'technology', 'computer', 'programming', 'software', 'development', 'database',
    'performance', 'optimization', 'scalability', 'architecture', 'framework', 'library',
    'application', 'interface', 'protocol', 'security', 'encryption', 'authentication',
    'authorization', 'validation', 'configuration', 'deployment', 'monitoring', 'analytics',
    'visualization', 'automation', 'integration', 'synchronization', 'communication',
    'collaboration', 'innovation', 'transformation', 'digitalization', 'modernization'
];

/**
 * Generate a random string of specified minimum length
 */
function generateRandomString(minLength = 1500) {
    const words = [];
    let currentLength = 0;
    
    while (currentLength < minLength) {
        const word = SAMPLE_WORDS[Math.floor(Math.random() * SAMPLE_WORDS.length)];
        words.push(word);
        currentLength += word.length + 1; // +1 for space
    }
    
    return words.join(' ');
}

/**
 * Generate a random title
 */
function generateRandomTitle() {
    const titleWords = [];
    const wordCount = Math.floor(Math.random() * 8) + 3; // 3-10 words
    
    for (let i = 0; i < wordCount; i++) {
        titleWords.push(SAMPLE_WORDS[Math.floor(Math.random() * SAMPLE_WORDS.length)]);
    }
    
    return titleWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Generate a random user ID
 */
function generateUserId(userCount = 1000) {
    return `user_${Math.floor(Math.random() * userCount) + 1}`;
}

/**
 * Generate a random role
 */
function generateRole() {
    return ROLES[Math.floor(Math.random() * ROLES.length)];
}

/**
 * Generate a single random message record
 */
function generateMessage(userCount = 1000) {
    return {
        user_id: generateUserId(userCount),
        role: generateRole(),
        title: generateRandomTitle(),
        message: generateRandomString(1500),
        config: generateRandomString(1500)
    };
}

/**
 * Generate multiple random message records
 */
function generateMessages(count, userCount = 1000) {
    const messages = [];
    for (let i = 0; i < count; i++) {
        messages.push(generateMessage(userCount));
    }
    return messages;
}

/**
 * Generate a batch of messages for testing
 */
function generateBatch(batchSize, userCount = 1000) {
    return generateMessages(batchSize, userCount);
}

/**
 * Get a random user ID from existing users (for read tests)
 */
function getRandomUserId(userCount = 1000) {
    return generateUserId(userCount);
}

/**
 * Generate test configuration
 */
function generateTestConfig(options = {}) {
    return {
        totalRecords: options.totalRecords || 1000000,
        batchSize: options.batchSize || 20,
        concurrency: options.concurrency || 10,
        userCount: options.userCount || 1000,
        readLimit: options.readLimit || 100,
        ...options
    };
}

module.exports = {
    generateMessage,
    generateMessages,
    generateBatch,
    generateRandomString,
    generateRandomTitle,
    generateUserId,
    generateRole,
    getRandomUserId,
    generateTestConfig,
    ROLES
};
