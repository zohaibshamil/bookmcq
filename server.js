// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const booksRoutes = require('./src/api/routes/books');
const chaptersRoutes = require('./src/api/routes/chapters');
const topicsRoutes = require('./src/api/routes/topics');
const questionsRoutes = require('./src/api/routes/questions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for MathJax
}));
app.use(compression());
app.use(cors({
    origin: ['http://localhost:3000', 'https://www.bookmcq.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/books', booksRoutes);
app.use('/api/chapters', chaptersRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/questions', questionsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route to serve HTML pages
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, 'public', req.path);
    // Check if it's a known HTML file
    const htmlFiles = ['practice.html', 'index.html', 'quiz.html', 'topics.html', 'contact.html', 'privacy.html'];
    const requestedFile = req.path === '/' ? 'index.html' : req.path;
    
    if (htmlFiles.includes(requestedFile)) {
        res.sendFile(path.join(__dirname, 'public', requestedFile));
    } else if (req.path.startsWith('/assets/') || req.path.startsWith('/styles.css')) {
        res.sendFile(filePath);
    } else {
        // Default to index.html for SPA-like behavior
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});
