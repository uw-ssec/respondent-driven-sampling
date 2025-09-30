import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
	{
		ignores: ['dist', 'build', 'node_modules', '*.min.js', '*.min.css']
	},
	{
		files: ['src/**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			ecmaVersion: 5, // Match tsconfig target: "es5"
			globals: {
				...globals.browser,
				...globals.es2021, // Support for modern JS features
				NodeJS: 'readonly' // Add NodeJS global
			},
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				ecmaFeatures: { jsx: true },
				sourceType: 'module',
				project: './tsconfig.json',
				tsconfigRootDir: import.meta.dirname
			}
		},
		settings: {
			react: { version: '18.2' },
			'import/resolver': {
				typescript: {
					project: './tsconfig.json'
				}
			}
		},
		plugins: {
			react,
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
			'@typescript-eslint': tseslint
		},
		rules: {
			...js.configs.recommended.rules,
			...react.configs.recommended.rules,
			...react.configs['jsx-runtime'].rules,
			...reactHooks.configs.recommended.rules,
			...tseslint.configs.recommended.rules,

			// React specific rules
			'react/jsx-no-target-blank': 'off',
			'react/prop-types': 'off', // We use TypeScript for prop validation
			'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
			'react-refresh/only-export-components': [
				'warn',
				{ allowConstantExport: true }
			],

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

			// General best practices
			'no-console': 'warn',
			'no-debugger': 'error',
			'no-duplicate-imports': 'error',
			'prefer-const': 'error',
			'no-var': 'error',
			'no-fallthrough': 'error' // Match tsconfig noFallthroughCasesInSwitch

			// Remove formatting rules - let Prettier handle these
			// Prettier will handle: indent, quotes, semi, comma-dangle, etc.
		}
	},
	{
		files: ['**/*.test.{js,jsx,ts,tsx}', '**/__tests__/**'],
		languageOptions: {
			globals: globals.jest
		},
		rules: {
			'no-console': 'off'
		}
	}
];
