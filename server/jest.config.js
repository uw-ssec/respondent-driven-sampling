export default {
	testEnvironment: 'node',
	moduleNamePattern: {
		'^@/(.*)$': '<rootDir>/src/$1'
	},
	moduleFileExtensions: ['js', 'json', 'ts'],
	testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
	collectCoverageFrom: [
		'**/*.js',
		'!**/node_modules/**',
		'!**/dist/**',
		'!**/coverage/**'
	],
	setupFilesAfterEnv: [],
	testPathIgnorePatterns: ['/node_modules/', '/dist/', '/src/'],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	// Keep existing JS tests for now, ignore TypeScript source
	roots: [
		'<rootDir>/__tests__',
		'<rootDir>/models/__tests__',
		'<rootDir>/routes/__tests__',
		'<rootDir>/utils/__tests__'
	]
};
