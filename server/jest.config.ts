export default {
	preset: 'ts-jest/presets/default-esm',
	extensionsToTreatAsEsm: ['.ts'],
	testEnvironment: 'node',
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			useESM: true
		}]
	},
	moduleFileExtensions: ['ts', 'js', 'json'],
	testMatch: [
		'**/__tests__/**/*.test.ts',
		'**/src/**/__tests__/**/*.test.ts',
		'**/?(*.)+(spec|test).ts'
	],
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
		'!src/**/__tests__/**',
		'!src/**/index.ts'
	],
	setupFilesAfterEnv: [],
	testPathIgnorePatterns: ['/node_modules/', '/build/', '/dist/'],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	roots: ['<rootDir>/src'],
	modulePathIgnorePatterns: ['<rootDir>/build/'],
	testTimeout: 30000
};
