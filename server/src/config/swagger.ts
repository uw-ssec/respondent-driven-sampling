import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Respondent-Driven Sampling API',
			version: '1.0.0',
			description: 'API for managing respondent-driven sampling surveys'
		},
		servers: [
			{
				url: 'http://localhost:1234',
				description: 'Development server'
			}
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT'
				}
			}
		},
		security: [
			{
				bearerAuth: []
			}
		]
	},
	apis: ['./src/routes/**/*.ts']
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
	app.use(
		'/documentation',
		swaggerUi.serve,
		swaggerUi.setup(specs, {
			explorer: true,
			customCss: '.swagger-ui .topbar { display: none }',
			customSiteTitle: 'RDS API Documentation'
		})
	);
};
