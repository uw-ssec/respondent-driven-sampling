import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

export default defineConfig({
	plugins: [react(), checker({ typescript: true }), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
			'@/components': path.resolve(__dirname, 'src/components'),
			'@/pages': path.resolve(__dirname, 'src/pages'),
			'@/types': path.resolve(__dirname, 'src/types'),
			'@/styles': path.resolve(__dirname, 'src/styles'),
			'@/assets': path.resolve(__dirname, 'src/assets')
			// Add more aliases as needed
		}
	},
	server: {
		port: 3000, // or your chosen port
		proxy: {
			'/api': {
				target: 'http://localhost:1234',
				changeOrigin: true,
				secure: false,
				ws: true
			}
		}
	}
});
