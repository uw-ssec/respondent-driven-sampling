// Import required modules
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const nocache = require('nocache');
const connectDB = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const surveyRoutes = require('./routes/surveys');
require('dotenv').config({ path: '../.env' });

const app = express();

// SECURITY FIRST - Apply security middleware before any other middleware
// This ensures all requests are protected from the start

// 1. Disable X-Powered-By header
app.disable('x-powered-by');

// 2. Apply Helmet for security headers - using strongest settings
app.use(helmet());

// 3. Explicit CSP settings - ensuring Content-Security-Policy is set correctly
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin'],
        reportUri: '/report-violation',
        reportTo: 'report-endpoint',
        upgradeInsecureRequests: [],
    }
}));

// 4. Explicit X-Frame-Options setting - preventing clickjacking
app.use(helmet.frameguard({ action: 'deny' }));

// 5. Strict Transport Security - forcing HTTPS
app.use(helmet.hsts({
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
}));

// 6. X-Content-Type-Options - preventing MIME type sniffing
app.use(helmet.noSniff());

// 7. X-XSS-Protection - adding browser XSS filtering
app.use(helmet.xssFilter());

// 8. Referrer Policy - controlling referrer information
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

// 9. Prevent browser caching for all responses to ensure fresh security headers
app.use(nocache());

// 10. Compression for better performance
app.use(compression());

// 11. Custom middleware to force security headers on every response
app.use((req, res, next) => {
    // Ensuring these headers are explicitly set on every response
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'same-origin');
    
    // Cookie security
    res.setHeader('Set-Cookie', 'HttpOnly; Secure; SameSite=Strict');
    
    // Removing unwanted headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    next();
});

// 12. Strict CORS settings - controlling cross-origin requests
app.use(cors({
    origin: '*', // Replace with specific domains in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
}));

// 13. Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Connect to MongoDB
// connectDB();

// Routes - each with enforced security headers
const securityWrapper = (router) => {
    return (req, res, next) => {
        // Set security headers before passing to router
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'");
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        router(req, res, next);
    };
};

// Apply routes with security wrapper
app.use('/api/auth', securityWrapper(authRoutes));
app.use('/api/pages', securityWrapper(pageRoutes));
app.use('/api/surveys', securityWrapper(surveyRoutes));

// Serve static files with security headers
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath, {
    setHeaders: (res) => {
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'");
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'same-origin');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }
}));

// Catch-all route handler with security headers
app.get('*', (req, res) => {
    // Set security headers
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Error handler with security headers
app.use((err, req, res, next) => {
    // Set security headers
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

(async () => {
    try {
      console.log('Starting DB connection...');
      await connectDB();
      console.log('DB connected successfully');
      const PORT = process.env.PORT || 1234;
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running with security headers at http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('Failed to connect to DB, server not started', error);
      process.exit(1);
    }
  })();
  

// // Set the port
// const PORT = process.env.PORT || 1234;
// app.listen(PORT, '0.0.0.0', () => console.log(`Server running with security headers at http://localhost:${PORT}`));
