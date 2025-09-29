import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
	{
		ignores: [
			'build',
			'dist',
			'node_modules',
			'*.min.js',
			'**/*.test.ts',
			'**/*.test.js'
		]
	},
	{
		files: ['src/**/*.{js,ts}'],
		languageOptions: {
			ecmaVersion: 2022, // Match tsconfig target: "ES2022"
			globals: {
				...globals.node,
				...globals.es2022
			},
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module',
				project: './tsconfig.json',
				tsconfigRootDir: import.meta.dirname
			}
		},
		settings: {
			'import/resolver': {
				typescript: {
					project: './tsconfig.json'
				}
			}
		},
		plugins: {
			'@typescript-eslint': tseslint
		},
		rules: {
			...js.configs.recommended.rules,
			...tseslint.configs.recommended.rules,

			// TypeScript specific rules - aligned with tsconfig strict mode
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true
				}
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			'@typescript-eslint/prefer-optional-chain': 'error',
			'@typescript-eslint/no-unnecessary-type-assertion': 'error',
			'@typescript-eslint/await-thenable': 'error',
			'@typescript-eslint/no-floating-promises': 'error',

			// Node.js/Express best practices
			'no-console': 'off', // Console logging is normal in server environments
			'no-debugger': 'error',
			'no-duplicate-imports': 'error',
			'prefer-const': 'error',
			'no-var': 'error',

			// Security considerations
			'no-eval': 'error',
			'no-implied-eval': 'error',
			'no-new-func': 'error',

			// Remove formatting rules - let Prettier handle these
			// Prettier will handle: indent, quotes, semi, comma-dangle, etc.

			// Error handling
			'no-throw-literal': 'error',
			'prefer-promise-reject-errors': 'error',

			// Performance
			'no-await-in-loop': 'warn',
			'require-atomic-updates': 'error',

			// ES2022 features
			'prefer-object-has-own': 'error'
		}
	},
	{
		files: ['**/*.test.{js,ts}', '**/__tests__/**'],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest
			}
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'no-console': 'off'
		}
	}
];
