module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js', // Skip main entry point for now (complex orchestrator)
    '!src/create-pr.js', // Skip complex GitHub API interactions for now
    '!src/upload-pr-comment.js', // Skip complex GitHub API interactions for now
    '!src/setup-ast-grep.js', // Skip system setup for now
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    // Per-file thresholds for testable modules
    './src/build-cli-args.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    // Global threshold for overall project (gradually increase over time)
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
